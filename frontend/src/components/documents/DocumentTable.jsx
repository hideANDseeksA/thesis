import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReusableMantineTable from "./../ReusableTable";
import { ActionIcon, Group, Button, Flex, TextInput, } from "@mantine/core";
import { IconEdit, IconTrashFilled, IconEye, IconPlus } from "@tabler/icons-react";
import FormModal from "@/components/documents/DocumentForm";
import { Search, RefreshCcw,Pin, PinOff } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { apiWithLoading,api } from "@/lib/axios";
import {showWarningAlert,showDeleteConfirmation} from "@/utils/dialog";
import {toastDelete, toastError,toastSuccess} from "@/utils/toast";

const CertificateTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const INPUT_HEIGHT = 36;
const [purposeOpen, setPurposeOpen] = useState(false);
const [selectedPurpose, setSelectedPurpose] = useState("");
const [selectedTitle, setSelectedTitle] = useState("");


  const [opened, setOpened] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleEdit = (row) => {
    setSelectedDocument(row.original);
    setOpened(true);
  };

  const handleDelete = async (row) => {
    const id = row.original.id;

    const confirm = await showDeleteConfirmation({
      title: "Delete Document",
      text: "Are you sure you want to delete this document? This action cannot be undone.",
      confirmText: "Yes, delete it",
    });

    if (!confirm) return;

    try {      await apiWithLoading.delete(`/documents/${id}`);
      toastDelete("Document deleted successfully", "The document was successfully deleted.");
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document", err);
      toastError("Failed to delete document. Please try again.");
    }
  };

  const handleView = (row) => {
    const url = row.original.file_url;
    if (!url) return;

    const viewerUrl = 
      url
   ;

    window.open(viewerUrl, "_blank");
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Document Name",
      },
   {
  accessorKey: "purpose",
  header: "Purpose",
  Cell: ({ row }) => {
    const purpose = row.original.purpose || "";

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedPurpose(purpose);
          setSelectedTitle(row.original.title);
          setPurposeOpen(true);
        }}
        disabled={!purpose}
      >
        View
      </Button>
    );
  },
},

      {
        id: "document_type",
        header: "Document Type",
        accessorFn: (row) => row.document_type?.name || "N/A",
        enableGrouping: true,
      },
      {
        accessorKey: "status",
        header: "Status",
      },
       {
        accessorKey: "is_public",
        header: "Public Viewing",
        Cell: ({ cell }) =>
        cell.getValue() ? 'Yes' : "No",
      },
           {
        accessorKey: "pin",
        header: "Pinned",
        Cell: ({ cell }) =>
        cell.getValue() ? <Pin/>: <PinOff/>,
      },

      {
        accessorKey: "file_url",
        header: "Document File",
        Cell: ({ row }) => (
          <Group spacing="xs">
            <Button
              rightIcon={<IconEye />}
              onClick={() => handleView(row)}
              variant="default"
            >
              View
            </Button>
          </Group>
        ),
      },
{
  accessorKey: "issued_date",
  header: "Issued Date",
  Cell: ({ cell }) => {
    const value = cell.getValue();

    return value
      ? new Date(value).toLocaleString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "";
  },
},
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <Group spacing="xs">
            <ActionIcon
              variant="transparent"
              color="black"
              onClick={() => handleEdit(row)}
            >
              <IconEdit />
            </ActionIcon>

            <ActionIcon
              color="red"
              variant="transparent"
              onClick={() => handleDelete(row)}
            >
              <IconTrashFilled />
            </ActionIcon>
          </Group>
        ),
      },
    ],
    []
  );

  return (
    <>


      {/* CREATE + EDIT MODAL */}
      <FormModal
        opened={opened}
        onClose={() => setOpened(false)}
        initialData={selectedDocument}
        onSuccess={fetchDocuments}
      />
      <Dialog open={purposeOpen} onOpenChange={setPurposeOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>{selectedTitle}</DialogTitle>
    </DialogHeader>

    <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
      {selectedPurpose}
    </div>
  </DialogContent>
</Dialog>

      <ReusableMantineTable
        columns={columns}
        data={data}



        tableOptions={{
          enableTopToolbar: true,
          enableColumnFilters: true,
          enableGlobalFilter: true,
          enablePagination: true,
          state: { isLoading: loading },


          enableGrouping: true,
          enableColumnAggregation: true,
          enableStickyFooter: true,
          enableStickyHeader: true,

          
    initialState: {
      grouping: ['document_type'],
      expanded: true,
      density: 'xs',
    },
        }}
        renderToolbar={({ table }) => (
          <Flex p="md" justify="space-between">
            <Flex gap="xs" align="center">
              <Flex
                align="center"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <ActionIcon
                  variant="subtle"
                  style={{
                    height: INPUT_HEIGHT,
                    width: INPUT_HEIGHT,
                    borderRight: "1px solid #ced4da",
                    borderRadius: 0,
                  }}
                  onClick={() => table.setGlobalFilter(searchValue)}
                >
                  <Search size={16} />
                </ActionIcon>

                <TextInput
                  placeholder="Search documents..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    table.setGlobalFilter(e.target.value);
                  }}
                  styles={{
                    input: {
                      height: INPUT_HEIGHT,
                      border: "none",
                      borderRadius: 0,
                    },
                  }}
                  style={{ width: 250 }}
                />

              </Flex>
              <ActionIcon
                variant="outline"
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
                onClick={() => fetchDocuments()}
              >
                <RefreshCcw size={16} />
              </ActionIcon>

              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>

            <Button
               className="btn-primary"
              leftIcon={<IconPlus />}
              onClick={() => {
                setSelectedDocument(null);
                setOpened(true);
              }}
            >
              Add Document
            </Button>
          </Flex>
        )}


      />


    </>
  );
};

export default CertificateTable;
