"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Palette,
    Save,
    Type,
    Image,
    Pipette,
    Hash,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dropzone,
    DropZoneArea,
    DropzoneMessage,
    DropzoneTrigger,
    useDropzone,
} from "@/components/ui/dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiWithLoading } from "@/lib/axios";
import { toastSuccess,toastError } from "@/utils/toast";
import { showWarningAlert } from "@/utils/dialog";

// Helper function to convert hex to HSL
function hexToHsl(hex) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const themeColors = [
    { name: "Blue", value: "blue", color: "bg-blue-600" },
    { name: "Green", value: "green", color: "bg-emerald-600" },
    { name: "Purple", value: "purple", color: "bg-violet-600" },
    { name: "Orange", value: "orange", color: "bg-orange-600" },
];

const presetHslMap = {
    blue:    "221 83% 53%",
    green:   "158 64% 52%",
    purple:  "258 90% 66%",
    orange:  "25 95% 53%",
    default: "221 83% 53%",
};

const STORAGE_KEY = "admin_settings_temp";

const clearInlineThemeVars = () => {
    const root = document.documentElement;
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--primary-foreground");
};

const applyPresetTheme = (theme) => {
    const hsl = presetHslMap[theme];
    const root = document.documentElement;
    root.removeAttribute("data-theme");
    if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--primary-foreground", "0 0% 100%");
    } else {
        clearInlineThemeVars();
    }
};

const applyCustomTheme = (hex) => {
    const hsl = hexToHsl(hex);
    const root = document.documentElement;

    root.removeAttribute("data-theme");
    document.documentElement.style.setProperty("--custom-primary", hsl);
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--primary-foreground", "0 0% 100%");
};

export default function AdminSettings({ tabMode = "full" }) {
    const [isLoading, setIsLoading] = useState(false);
    const [logoFile, setLogoFile] = useState(null);

    const stored =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
            : null;

    const [appName, setAppName] = useState("My App");
    const [slogan, setSlogan] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [hideAppName, setHideAppName] = useState(false);

    const [themeColor, setThemeColor] = useState("default");
    const [customColor, setCustomColor] = useState("");

    const [ticketPrefix, setTicketPrefix] = useState("T-");
    const [ticketNumberType, setTicketNumberType] = useState("sequential");
    const [ticketNumberLength, setTicketNumberLength] = useState(6);

    const isCustomTheme = themeColor.startsWith("#");

    useEffect(() => {
        if (isCustomTheme) setCustomColor(themeColor);
    }, [themeColor, isCustomTheme]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setIsLoading(true);
                const { data } = await apiWithLoading.get("/system");

                if (!data) return;

                setAppName(data.web_name ?? "My App");
                setLogoUrl(data.logo_url ?? "");
                setThemeColor(data.web_color ?? "default");

                setTicketPrefix(data.residentPrefix ?? "T-");
                setTicketNumberType(data.residentNumberType ?? "sequential");
                setTicketNumberLength(data.residentNumberLength ?? 6);

                // apply theme instantly
                if (data.web_color?.startsWith("#")) {
                    setCustomColor(data.web_color);
                    applyCustomTheme(data.web_color);
                } else {
                    applyPresetTheme(data.web_color ?? "default");
                }

            } catch {
                toast.error("Failed to load system settings");
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);

      const confirm = await showWarningAlert({
         title: `Update System Settings?`,
          text: `Are you sure you want to update the system settings? This will affect the entire application.`,
       }
       
       );

        if (!confirm) {
            setIsLoading(false);
            return;
        }

        try {
            const formData = new FormData();

            formData.append("web_name", appName);
            formData.append("web_color", themeColor);
            formData.append("residentPrefix", ticketPrefix);
            formData.append("residentNumberType", ticketNumberType);
            formData.append(
                "residentNumberLength",
                ticketNumberLength.toString()
            );

            if (logoFile) {
                formData.append("logo", logoFile);
            }

            await apiWithLoading.post("/system", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toastSuccess("Settings saved","System settings updated successfully.");
        } catch (err) {
            toastError("Error","Failed to save settings");
        } finally {
            setIsLoading(false);
        }
    };


    function LogoDropzone() {
        const dropzone = useDropzone({
            onDropFile: async (file) => {
                const previewUrl = URL.createObjectURL(file);

                setLogoFile(file);
                setLogoUrl(previewUrl);

                return {
                    status: "success",
                    result: previewUrl,
                };
            },
            validation: {
                accept: {
                    "image/*": [".png", ".jpg", ".jpeg"],
                },
                maxSize: 10 * 1024 * 1024,
                maxFiles: 1,
            },
            shiftOnMaxFiles: true,
        });

        const isPending = dropzone.fileStatuses[0]?.status === "pending";

        return (
            <Dropzone {...dropzone}>
                <DropZoneArea>
                    <DropzoneTrigger className="flex gap-8 bg-transparent text-sm">
                        <Avatar className={cn(isPending && "animate-pulse")}>
                            <AvatarImage
                                className="object-cover"
                                src={logoUrl || "/placeholder.png"}
                            />
                            <AvatarFallback>LOGO</AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-1 font-semibold">
                            <p>Upload a new logo</p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG up to 10MB
                            </p>
                        </div>
                    </DropzoneTrigger>
                </DropZoneArea>
                <DropzoneMessage />
            </Dropzone>
        );
    }

    const renderGeneralSettings = () => (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Application Settings
                    </CardTitle>
                    <CardDescription>
                        Configure the basic settings for your application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="appName">Application Name</Label>
                        <Input
                            id="appName"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="Enter application name"
                        />
                        <p className="text-sm text-muted-foreground">
                            Displayed in header and browser title.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Resident ID Settings
                    </CardTitle>
                    <CardDescription>
                        Configure how IDs are generated and displayed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ticketPrefix">Prefix</Label>
                            <Input
                                id="ticketPrefix"
                                value={ticketPrefix}
                                onChange={(e) => setTicketPrefix(e.target.value.toUpperCase())}
                                maxLength={5}
                            />
                            <p className="text-sm text-muted-foreground">
                                Prefix for all IDs (e.g., TKT).
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ticketNumberType">Number Type</Label>
                            <Select
                                value={ticketNumberType}
                                onValueChange={setTicketNumberType}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sequential">Sequential</SelectItem>
                                    <SelectItem value="random">Random</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Choose sequential or random numbering.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ticketNumberLength">Number Length</Label>
                            <Select
                                value={ticketNumberLength.toString()}
                                onValueChange={(v) => setTicketNumberLength(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[4, 5, 6, 7, 8].map((n) => (
                                        <SelectItem key={n} value={n.toString()}>
                                            {n} digits
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Length of the numeric part.
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <div className="font-mono text-lg">
                            {ticketPrefix}
                            {ticketNumberType === "sequential"
                                ? "0".repeat(Math.max(0, ticketNumberLength - 1)) + "1"
                                : "A".repeat(Math.ceil(ticketNumberLength / 2)) +
                                "1".repeat(Math.floor(ticketNumberLength / 2))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Example of how IDs will look.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </>
    );

    const renderCustomizeSettings = () => (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Logo & Branding
                    </CardTitle>
                    <CardDescription>
                        Customize branding with a logo and display settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Logo Upload</Label>
                        <LogoDropzone />
                        <p className="text-sm text-muted-foreground">
                            Drag & drop your logo or click to upload.
                        </p>
                    </div>

                    {logoUrl && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Logo Preview</Label>
                                <div className="border rounded-lg p-4 bg-muted/50">
                                    <img
                                        src={logoUrl}
                                        alt="Logo preview"
                                        className="h-12 w-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Theme Colors
                    </CardTitle>
                    <CardDescription>
                        Choose the primary color scheme for your application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="text-sm font-medium mb-3 block">
                            Preset Colors
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {themeColors.map((theme) => (
                                <div
                                    key={theme.value}
                                    className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${themeColor === theme.value
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                    onClick={() => {
                                        setThemeColor(theme.value);
                                        setCustomColor("");
                                        applyPresetTheme(theme.value);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full ${theme.color}`} />
                                        <span className="text-sm font-medium">{theme.name}</span>
                                    </div>
                                    {themeColor === theme.value && (
                                        <Badge className="absolute -top-2 -right-2 text-xs btn-primary">
                                            Active
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className={`${isCustomTheme ? "opacity-100" : "opacity-50"}`}>
                            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                                Custom Color
                                {isCustomTheme && (
                                    <Badge variant="secondary" className="text-xs">
                                        Active
                                    </Badge>
                                )}
                            </Label>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={customColor || "#3b82f6"}
                                        onChange={(e) => {
                                            const hex = e.target.value;
                                            setCustomColor(hex);
                                            setThemeColor(hex);
                                            applyCustomTheme(hex);
                                        }}
                                        className="w-12 h-12 rounded-md border border-input cursor-pointer bg-transparent"
                                        style={{ padding: "2px" }}
                                    />
                                    <Pipette className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none opacity-60" />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        value={customColor}
                                        onChange={(e) => {
                                            const hex = e.target.value;
                                            setCustomColor(hex);

                                            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                                                setThemeColor(hex);
                                                applyCustomTheme(hex);
                                            }
                                        }}
                                        placeholder="#3b82f6"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Changes apply instantly. Click a preset to deactivate custom mode.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );

    return (
        <div className="grid gap-6">
            {tabMode === "general" && renderGeneralSettings()}
            {tabMode === "customize" && renderCustomizeSettings()}
            {tabMode === "full" && (
                <>
                    {renderGeneralSettings()}
                    {renderCustomizeSettings()}
                </>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    );
}