import { useEffect, useMemo, useState } from 'react'
import ReusableMantineTable from '../ReusableTable'
import { ActionIcon, Group, Flex, TextInput } from "@mantine/core";
import { IconArchiveOff, IconTrash, IconTrashFilled } from "@tabler/icons-react";
import { Search, RefreshCcw } from "lucide-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";
import { getArchiveResidents, deleteResident, patchResidentRemarks } from './api/resident.api';
import { toastDelete, toastError, toastSuccess } from '@/utils/toast';
import { showDeleteConfirmation, showWarningAlert } from '@/utils/dialog';

const Example = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)

  const [searchValue, setSearchValue] = useState("")
  const [columnFilters, setColumnFilters] = useState([])  // ← track column filters in state

  const INPUT_HEIGHT = 36
  const totalResidentsOnPage = useMemo(() => data.length, [data])

  const columns = useMemo(() => [
    {
      accessorKey: 'resident_id',
      header: 'Resident ID',
      aggregationFn: 'count',
      AggregatedCell: ({ cell }) => (
        <strong>{cell.getValue()} residents</strong>
      ),
    },
    {
      header: 'Full Name',
      id: 'full_name',
      accessorFn: (row) => {
        const middleInitial = row.m_name
          ? `${row.m_name.charAt(0).toUpperCase()}.`
          : ''
        return `${row.l_name}, ${row.f_name} ${middleInitial}`.trim()
      },
      enableColumnFilter: true,          // ← required
      filterFn: 'includesString',        // ← required
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      id: 'purok',
      header: 'Purok',
      accessorFn: (row) => row.purok?.name || 'N/A',
      enableColumnFilter: true,
      filterFn: 'includesString',
    },
    {
      accessorKey: 'house_no',
      header: 'House No.',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'sex',
      header: 'Sex',
      enableColumnFilter: true,
      filterFn: 'includesString',
      mantineTableBodyCellProps: { className: 'capitalize text-sm font-medium' },
    },
    {
      accessorKey: 'b_date',
      header: 'Birth Date',
      Cell: ({ cell }) =>
        cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : '',
    },
    {
      accessorKey: 'b_place',
      header: 'Birth Place',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
      enableColumnFilter: true,
      filterFn: 'includesString',
      mantineTableBodyCellProps: { className: 'capitalize' },
    },
    {
      accessorKey: 'voting_status',
      header: 'Voting Status',
      enableColumnFilter: true,
      filterFn: 'includesString',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'sector',
      header: 'Sector',
      enableColumnFilter: true,
      filterFn: 'includesString',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'age',
      header: 'Age',
      Cell: ({ cell }) => (cell.getValue() ?? 'N/A'),
      enableColumnFilter: true,
      filterFn: 'between',
    },
    {
      accessorKey: 'contact_no',
      header: 'Contact No.',
      Cell: ({ cell }) => cell.getValue() ? cell.getValue() : 'N/A',
    },
    {
      accessorKey: 'email_address',
      header: 'Email',
      aggregationFn: 'count',
      AggregatedCell: ({ cell }) => (
        <span style={{ color: 'skyblue' }}>{cell.getValue()} with email</span>
      ),
    },
    {
      accessorKey: 'times_tamp',
      header: 'Created At',
      Cell: ({ cell }) =>
        cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '',
    },
    {
      id: "actions",
      header: "Actions",
      enableColumnFilter: false,   // ← no filter on actions column
      Cell: ({ row }) => (
        <Group spacing="xs">
          <ActionIcon
            color="green"
            title="Restore Resident"
            onClick={() => handleRestore(row)}
          >
            <IconArchiveOff />
          </ActionIcon>
          <ActionIcon
            color="red"
            title="Delete Permanently"
            onClick={() => handleDelete(row)}
          >
            <IconTrashFilled />
          </ActionIcon>
        </Group>
      ),
    },
  ], [totalResidentsOnPage])

  const fetchResidents = async () => {
    setLoading(true)
    try {
      const res = await getArchiveResidents({ page, limit })
      setData(res.residents ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (err) {
      console.error('Failed to load archived residents', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResidents()
  }, [page, limit])

  const handleRestore = async (row) => {
    const id = row.original.id
    const confirmed = await showWarningAlert({
      title: "Restore Resident",
      text: "Are you sure you want to restore this resident back to the active list?",
    })
    if (!confirmed) return
    try {
      await patchResidentRemarks(id, '')
      toastSuccess("Resident restored", "Resident has been moved back to the active list.")
      fetchResidents()
    } catch (err) {
      toastError("Failed to restore resident. Please try again.")
    }
  }

  const handleDelete = async (row) => {
    const id = row.original.id
    const confirmed = await showDeleteConfirmation({
      title: "Delete Permanently",
      text: "Are you sure you want to permanently delete this resident? This cannot be undone.",
    })
    if (!confirmed) return
    try {
      await deleteResident(id)
      toastDelete("Resident deleted", "Resident has been permanently removed.")
      fetchResidents()
    } catch (err) {
      toastError("Failed to delete resident. Please try again.")
    }
  }

  return (
    <>
      <ReusableMantineTable
        columns={columns}
        data={data}
        tableOptions={{
          enableColumnFilters: true,
          enableGlobalFilter: false,   // ← turn off global filter; use column filters instead
          enablePagination: true,
          enableGrouping: true,
          enableColumnAggregation: true,
          enableStickyFooter: true,
          enableStickyHeader: true,

          // ✅ KEY FIX: explicitly set manualFiltering to false so the table
          // filters the local data instead of expecting the server to do it
          manualPagination: true,
          manualFiltering: false,      // ← this is what makes local column filters work

          rowCount: total,
          mantineTableContainerProps: {
            style: {
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
              tableLayout: "auto",
            },
          },
          initialState: {
            grouping: ['purok'],
            expanded: true,
            density: 'xs',
            columnFilters: [],
          },
          state: {
            isLoading: loading,
            columnFilters,             // ← pass controlled filter state
            pagination: {
              pageIndex: page - 1,
              pageSize: limit,
            },
          },
          // ← keep filter state in sync so MRT can control it
          onColumnFiltersChange: (updater) => {
            const next =
              typeof updater === 'function' ? updater(columnFilters) : updater
            setColumnFilters(next)
          },
          onPaginationChange: (updater) => {
            const next =
              typeof updater === 'function'
                ? updater({ pageIndex: page - 1, pageSize: limit })
                : updater
            setPage(next.pageIndex + 1)
            setLimit(next.pageSize)
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
                >
                  <Search size={16} />
                </ActionIcon>
                <TextInput
                  placeholder="Search archived residents..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value)
                    table.setGlobalFilter(e.target.value)
                  }}
                  styles={{
                    input: { height: INPUT_HEIGHT, border: "none", borderRadius: 0 },
                  }}
                  style={{ width: 250 }}
                />
              </Flex>

              <ActionIcon
                variant="outline"
                style={{ height: INPUT_HEIGHT, width: INPUT_HEIGHT }}
                onClick={() => fetchResidents()}
              >
                <RefreshCcw size={16} />
              </ActionIcon>

              <MRT_ToggleFiltersButton table={table} />
              <MRT_ShowHideColumnsButton table={table} />
            </Flex>
          </Flex>
        )}
      />
    </>
  )
}

export default Example