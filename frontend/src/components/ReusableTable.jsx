import { MantineReactTable, useMantineReactTable } from "mantine-react-table";

const ReusableMantineTable = ({
  columns,
  data,
  tableOptions = {},
  renderToolbar,
}) => {
  // Sanitize columns to ensure filter values never become undefined
  const sanitizedColumns = columns.map((col) => ({
    ...col,
    filterFn: col.filterFn ?? "contains",
  }));

  const table = useMantineReactTable({
    columns: sanitizedColumns,
    data: data ?? [],                    // ← prevent undefined data

    enableTopToolbar: true,
    renderTopToolbar: renderToolbar,

    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
      columnFilters: [],                 // ← explicitly initialize as empty array
      ...tableOptions.initialState,      // ← merge caller's initialState safely
    },

    // Ensure filter state stays controlled — never undefined
    onColumnFiltersChange: (updater) => {
      tableOptions.onColumnFiltersChange?.(updater);
    },

    ...tableOptions,

 
  });

  return <MantineReactTable table={table} />;
};

export default ReusableMantineTable;