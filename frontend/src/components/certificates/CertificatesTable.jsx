import { useEffect, useMemo, useState } from 'react'
import { api, apiWithLoading } from '@/lib/axios'
import ReusableMantineTable from './../ReusableTable'
import { ActionIcon, Group, Button, Flex, TextInput } from '@mantine/core'
import { IconEdit, IconPrinter, IconEye, IconPlus, IconCertificate } from '@tabler/icons-react'
import FormModal from '@/components/certificates/CertificateForm'
import DynamicForm from '@/components/forms/generate-certificate'
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { Search, RefreshCcw } from "lucide-react";
import { getItem } from '@/utils/localStorageHelper'
import { showWarningAlert, showDeleteConfirmation } from '@/utils/dialog'
import { IconTrashFilled } from '@tabler/icons-react'
import { toastDelete, toastError } from '@/utils/toast'

const CertificateTable = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)
  const [searchValue, setSearchValue] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);   // ← added
  const INPUT_HEIGHT = 36;
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [generateOpened, setGenerateOpened] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const tempResident = getItem('Temp_Resident')

  const handleGenerate = (row) => {
    setSelectedTemplate(row.original)
    setGenerateOpened(true)
  }

  const handleEdit = (row) => {
    setSelectedCertificate(row.original);
    setOpened(true);
  };

  const handleDelete = async (row) => {
    const id = row.original.id;
    const confirmed = await showDeleteConfirmation({ title: "Certificate", text: "Are you sure you want to delete this certificate? This action cannot be undone." });
    if (!confirmed) return;

    try {
      await apiWithLoading.delete(`/certificates/${id}`)
      setData((prev) => prev.filter((item) => item.id !== id))
      toastDelete("Certificate deleted", "The certificate has been permanently removed.")
    } catch (err) {
      console.error("Failed to delete certificate", err)
      toastError("Failed to delete certificate", "An error occurred while deleting the certificate.")
    }
  }

  const handleView = (row) => {
    const url = row.original.template_url
    if (!url) return
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
    window.open(viewerUrl, '_blank')
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'template_name',
      header: 'Certificate Name',
      enableColumnFilter: true,
      filterFn: "includesString",
      mantineTableBodyCellProps: {
        className: 'capitalize text-sm font-medium',
      },
    },
    {
      accessorKey: 'template_price',
      header: 'Price',
      enableColumnFilter: false,
      Cell: ({ cell }) =>
        new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(cell.getValue() ?? 0),
    },
    {
      accessorKey: 'requestType',
      header: 'Request Type',
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => cell.getValue() ? 'Online Request' : "Appointment Only",
    },
    {
      accessorKey: 'public_view',
      header: 'Public View',
      enableColumnFilter: true,
      filterFn: "includesString",
      Cell: ({ cell }) => cell.getValue() ? 'Yes' : "No",
    },
    {
      accessorKey: 'template_url',
      header: 'Template',
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <Button rightIcon={<IconEye />} variant="default" onClick={() => handleView(row)}>
          View
        </Button>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: 'Created At',
      enableColumnFilter: false,
      Cell: ({ cell }) =>
        cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableColumnFilter: false,
      Cell: ({ row }) => (
        <Group spacing="xs">
          {tempResident && (
            <ActionIcon
              color="violet"
              title="Generate Certificate"
              onClick={() => handleGenerate(row)}
            >
              <IconPrinter />
            </ActionIcon>
          )}
          <ActionIcon color="blue" title="Edit Certificate" onClick={() => handleEdit(row)}>
            <IconEdit />
          </ActionIcon>
          <ActionIcon color="red" title="Delete Certificate" onClick={() => handleDelete(row)}>
            <IconTrashFilled />
          </ActionIcon>
        </Group>
      ),
    },
  ], [tempResident])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const res = await apiWithLoading.get(`/certificates`, { withCredentials: true })
      setData(res.data)
    } catch (err) {
      console.error('Failed to load certificates', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
  }, [])

  return (
    <>
      <FormModal
        opened={opened}
        onClose={() => setOpened(false)}
        initialData={selectedCertificate}
        onSuccess={fetchCertificates}
      />

      {generateOpened && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md lg:max-w-xl max-h-[90vh]">
            <DynamicForm
              templateId={selectedTemplate.id}
              requestType={selectedTemplate.requestType}
              submitLabel={selectedTemplate.requestType ? "Generate" : "Submit"}
              cancelLabel="Cancel"
              onSubmit={(data, template) => {
                console.log("Form Data:", data);
                console.log("Template Info:", template);
                setGenerateOpened(false);
                setSelectedTemplate(null);
              }}
              onCancel={() => {
                setGenerateOpened(false);
                setSelectedTemplate(null);
              }}
            />
          </div>
        </div>
      )}

      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableTopToolbar: true,
          enableColumnFilters: true,        // ← enable column filters
          enableGlobalFilter: true,        // ← off; search bar handles it manually
          manualFiltering: false,           // ← filter local data
          enablePagination: true,
          initialState: {
            columnFilters: [],
          },
          state: {
            isLoading: loading,
            columnFilters,                  // ← pass controlled state
          },
          onColumnFiltersChange: (updater) => {
            const next =
              typeof updater === "function" ? updater(columnFilters) : updater;
            setColumnFilters(next);
          },
        }}
        renderToolbar={({ table }) => (
          <Flex p="md" justify="space-between">
            <Flex gap="xs" align="center">
              <Flex
                align="center"
                style={{ border: "1px solid #ced4da", borderRadius: 4, overflow: "hidden" }}
              >
                <ActionIcon
                  variant="subtle"
                  style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT, borderRight: "1px solid #ced4da", borderRadius: 0 }}
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
                  styles={{ input: { height: INPUT_HEIGHT, border: "none", borderRadius: 0 } }}
                  style={{ width: 250 }}
                />
              </Flex>
              <ActionIcon
                variant="outline"
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
                onClick={() => fetchCertificates()}
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
                setSelectedCertificate(null);
                setOpened(true);
              }}
            >
              Add Certificate
            </Button>
          </Flex>
        )}
      />
    </>
  )
}

export default CertificateTable