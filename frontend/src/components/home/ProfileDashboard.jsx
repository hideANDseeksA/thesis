import React , { useEffect }from 'react';
import { useNavigate} from "react-router-dom";
import { Settings, Mail, Phone, MapPin, Link2, Clock, Download, Briefcase, BadgeCheck, ChevronRight, Calendar, VenusAndMars, IdCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getItem } from '@/utils/localStorageHelper';
import { capitalizeWords } from '@/lib/capitalizer';
import { contacts } from '@/context/contact'
import { useUserTransactions } from '@/hooks/useUserTransactions';
import { setItem } from '@/utils/localStorageHelper';
import ProfilePageSkeleton from '../client/ProfileSkeleton';
import MaleProfile from '@/assets/image/boy.png'
import WomanProfile from '@/assets/image/woman.png'
import BarangayCheckupProcess from '../referalsProcess';

export default function ProfilePage() {

    const navigate = useNavigate();
    const userId = getItem("resident_id");
    const {
        resident,
        latestTransactions,
        latestDocuments,
        latestComplaints,
        loading,
        error
    } = useUserTransactions(userId)
    useEffect(() => {
        if (resident) {
            setItem("resident_data", resident);
          
        }
    }, [resident]);



    if (loading) return <ProfilePageSkeleton />
    if (error) return <p>{error}</p>

    return (
        <div className="min-h-screen  p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold ">Profile Page</h1>

                </div>



                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <Avatar className="w-20 h-20 border-[2px] border-[hsl(var(--primary))] bg-transparent" >
                                        <AvatarImage
                                            src={resident?.sex === "male" ? MaleProfile : WomanProfile}
                                            alt={resident?.name || "Avatar"}
                                        />

                                        <AvatarFallback>AH</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center justify-center gap-2">
                                            <h2 className="text-xl font-semibold">{capitalizeWords(resident?.f_name)} {resident?.m_name && `${capitalizeWords(resident?.m_name).charAt(0)}.`} {capitalizeWords(resident?.l_name)}</h2>
                                            {/* <Badge className= "btn-primary" variant="outline" >Pro</Badge> */}
                                        </div>
                                        <p className=" text-sm mt-1">{resident?.sector || "Resident"}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 divide-x divide-gray-200 border border-gray-200 rounded-lg mt-6 ">
                                    <div className="text-center py-3">
                                        <div className="text-lg font-semibold capitalize">{resident?.purok.name|| "N/A"}</div>
                                        <div className=" text-sm">Purok</div>
                                    </div>
                                    <div className="text-center py-3">
                                        <div className="text-lg font-semibold">{resident?.house_no || "N/A"}</div>
                                        <div className=" text-sm">House No.</div>
                                    </div>
                                    <div className="text-center py-3">
                                        <div className="text-lg font-semibold">{resident?.age || "N/A"}</div>
                                        <div className=" text-sm">Age</div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center gap-3 text-sm ">
                                        <Mail className="w-4 h-4 " />
                                        <span>{resident?.email_address}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm ">
                                        <Phone className="w-4 h-4 " />
                                        <span>(+63) {resident?.contact_no}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm ">
                                        <MapPin className="w-4 h-4 " />
                                        <span className='capitalize'>{resident?.b_place || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="w-4 h-4 " />
                                        <span>{new Date(resident?.b_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <IdCard className="w-4 h-4 " />
                                        <span className='uppercase'>{resident?.resident_id}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                      
                        <BarangayCheckupProcess />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Latest Activity Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle>Latest News</CardTitle>
                                <a     onClick={() =>
                                                                navigate("/resident/documents")
                                                            } className=" hover: text-sm hover:underline">
                                    View All
                                </a>
                            </CardHeader>
                            <CardContent>
                                {latestDocuments && latestDocuments.length > 0 ? (
                                    <div className="space-y-6 sm:space-y-8 pl-4 sm:pl-6 border-l-2 border-gray-200">
                                        {latestDocuments.map((doc) => (
                                            <div key={doc.id} className="relative">
                                                {/* Timeline Icon */}
                                                <div className="absolute -left-7 sm:-left-9 top-0 w-6 h-6 btn-primary border-2 border-gray-200 rounded-full flex items-center justify-center">
                                                    <Briefcase className="w-3 h-3" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-semibold">
                                                            {doc.title}
                                                        </h4>
                                                        <Badge>
                                                            {doc.document_type.name}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            Issued on {new Date(doc.issued_date).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                             <p className="text-sm text-justify whitespace-pre-line">
  {doc.purpose}
</p>
                                                    {doc.file_url && (
                                                        <Button
                                                            variant="outline"
                                                            className="mt-2"
                                                            onClick={() =>
                                                                navigate("/resident/documents/view", {
                                                                    state: {
                                                                        url: doc.file_url,
                                                                        title: doc.title,
                                                                    },
                                                                })
                                                            }
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            View Document
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No latest documents available.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bottom Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                            {/* Transaction History Card */}
                            <Card className="flex flex-col h-[500px]">
                                <CardHeader>
                                    <CardTitle>Transaction History</CardTitle>
                                </CardHeader>

                                <CardContent className="flex-1 overflow-auto scrollbar-hide mb-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Certificate</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {latestTransactions.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-sm">
                                                        No transactions found
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {latestTransactions.map(tx => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="capitalize">
                                                        {tx.certificate?.template_name || 'N/A'}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                tx.status === 'approved'
                                                                    ? 'success'
                                                                    : tx.status === 'rejected'
                                                                        ? 'destructive'
                                                                        : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                                            }
                                                            className="capitalize"
                                                        >
                                                            {tx.status}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        {tx.timestamp
                                                            ? new Date(tx.timestamp).toLocaleDateString()
                                                            : 'N/A'}
                                                    </TableCell>

                                                    <TableCell className="text-right font-medium">
                                                        ₱{tx.certificate?.template_price ?? '0.00'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>


                       {/* Complaints Card */}
<Card className="flex flex-col h-[500px]">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>My Complaints</CardTitle>
 
    </CardHeader>
    <CardContent className="mt-4 flex-1 overflow-auto scrollbar-hide mb-8">
        {latestComplaints && latestComplaints.length > 0 ? (
            <div className="space-y-4">
                {latestComplaints.map((complaint, index) => (
                    <div
                        key={complaint.id || index}
                        className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg"
                    >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                                {complaint.complaint_type}
                            </span>
                            <Badge
                                variant={
                                    complaint.status === "resolved"
                                        ? "success"
                                        : complaint.status === "rejected"
                                        ? "destructive"
                                        : "outline"
                                }
                                className="capitalize"
                            >
                                {complaint.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {complaint.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                                Filed on {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground">
                No complaints filed yet.
            </p>
        )}
    </CardContent>
</Card>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}