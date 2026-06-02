import { useEffect, useMemo, useState } from 'react'
import ReusableMantineTable from '../ReusableTable'
import { ActionIcon, Group, Flex, TextInput, } from "@mantine/core";
import { IconTrash, IconTrashFilled } from "@tabler/icons-react";
import { Search, RefreshCcw } from "lucide-react";
import {
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
} from "mantine-react-table";

import { getBDACResidents,patchResidentRemarks } from './api/resident.api';
import { get } from 'react-hook-form';
import { toastError,toastSuccess } from '@/utils/toast';
import { showDeleteConfirmation } from '@/utils/dialog';
const Example = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const totalResidentsOnPage = useMemo(() => data.length, [data])
  const [searchValue, setSearchValue] = useState("");
  const INPUT_HEIGHT = 36;
  const [selectedResident, setSelectedResident] = useState(null);
  const [opened, setOpened] = useState(false);
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
      },    mantineTableBodyCellProps: {
      className: 'capitalize',
    },
    },
    {
      id: 'purok', // give it a proper id so grouping works
      header: 'Purok',
      accessorFn: (row) => row.purok?.name || 'N/A',
      enableColumnFilter: true,
    },

    {
      accessorKey: 'house_no',
      header: 'House No.',
      Cell: ({ cell }) =>
        cell.getValue()
          ? cell.getValue()
          : 'N/A',
    },

    {
      accessorKey: 'sex',
      header: 'Sex',
          mantineTableBodyCellProps: {
      className: 'capitalize text-sm font-medium',
    },
    },

    {
      accessorKey: 'b_date',
      header: 'Birth Date',
      Cell: ({ cell }) =>
        cell.getValue()
          ? new Date(cell.getValue()).toLocaleDateString() // <-- only date
          : '',
    },


    {
      accessorKey: 'b_place',
      header: 'Birth Place',
      Cell: ({ cell }) =>
        cell.getValue()
          ? cell.getValue()
          : 'N/A',
          
          
          mantineTableBodyCellProps: {
      className: 'capitalize',
    },
    },


    {
      accessorKey: 'voting_status',
      header: 'Voting Status',
      Cell: ({ cell }) =>
        cell.getValue()
          ? cell.getValue()
          : 'N/A',

    },


    {
      accessorKey: 'sector',
      header: 'Sector',
      Cell: ({ cell }) =>
        cell.getValue()
          ? cell.getValue()
          : 'N/A',
    },

    {
      accessorKey: 'age',
      header: 'Age',
      Cell: ({ cell }) => (cell.getValue() ?? 'N/A'),
      enableColumnFilter: true,
      filterFn: 'between', // range filter
    },

    {
      accessorKey: 'contact_no',
      header: 'Contact No.',
      Cell: ({ cell }) =>
        cell.getValue()
          ? cell.getValue()
          : 'N/A',
    },
    {
      accessorKey: 'email_address',
      header: 'Email',
      aggregationFn: 'count',
      AggregatedCell: ({ cell }) => (
        <span style={{ color: 'skyblue' }}>
          {cell.getValue()} with email
        </span>
      ),
    },
    {
      accessorKey: 'times_tamp',
      header: 'Created At',
      Cell: ({ cell }) =>
        cell.getValue()
          ? new Date(cell.getValue()).toLocaleString()
          : '',
    },
    {
      id: "actions",
      header: "Actions",
      Cell: ({ row }) => (
        <Group spacing="xs">

          <ActionIcon
            color="red"
            title="Remove Resident"
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
      const res = await getBDACResidents({
        page,
        limit,
      })

      // ✅ correct response usage
      setData(res.residents)
      setTotal(res.data.meta?.total)
    } catch (err) {
      console.error('Failed to load residents', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchResidents()
  }, [page, limit])

  const handleEdit = (row) => {
    setSelectedResident(row.original);
    setOpened(true);
  };
   const handleDelete = async (row) => {
     const id = row.original.id
     const confirmed = await showDeleteConfirmation({
       title: "Remove Resident Record",
       text: "Are you sure you want to remove this resident? This action cannot be undone.",
     });
     if (!confirmed) return;
     try {
       await patchResidentRemarks(id,'');
       toastSuccess("Resident removed successfully", "Resident successfully removed in BDAC list.");
       fetchResidents();
 
     } catch (err) {
       toastError("Failed to remove resident. Please try again.");
     }
   }
  return (

    <>    

      <ReusableMantineTable
        columns={columns}
        data={data}
        
        tableOptions={{
          enableColumnFilters: true,
          enableGlobalFilter: true,
          enablePagination: true,
          

          // 🔥 aggregation + grouping
          enableGrouping: true,
          enableColumnAggregation: true,
          enableStickyFooter: true,
          enableStickyHeader: true,
   mantineTableContainerProps: {
      style: {
        maxHeight: "calc(100vh - 320px)",
        overflowY: "auto",
        tableLayout: "auto",
      },
    },
          // server-side pagination
          manualPagination: true,
          rowCount: total,

          initialState: {
            grouping: ['purok'], // 👈 try grouping by last name
            expanded: true,
            density: 'xs',
          },

          state: {
            isLoading: loading,
            pagination: {
              pageIndex: page - 1,
              pageSize: limit,
            },
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
                  onClick={() => table.setGlobalFilter(searchValue)}
                >
                  <Search size={16} />
                </ActionIcon>

                <TextInput
                  placeholder="Search Residentss..."
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
