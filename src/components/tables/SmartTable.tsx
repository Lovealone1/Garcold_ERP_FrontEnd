"use client";

import * as React from "react";
import {
    Box, Stack, Typography, TextField, InputAdornment, Button, Table,
    TableHead, TableRow, TableCell, TableBody, IconButton, MenuItem, Select
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Pagination } from "@mui/material";

export type Column<T> = {
    key: keyof T | string;
    header: string;
    align?: "left" | "right" | "center";
    width?: number | string;
    render?: (row: T) => React.ReactNode;
};

export type SmartTableProps<T> = {
    title: string;
    searchPlaceholder?: string;
    initialSearch?: string;
    filters?: React.ReactNode[];          
    onSearch?: (q: string) => void;
    onAdd?: () => void;
    addLabel?: string;

    columns: Column<T>[];
    rows: T[];
    getRowId: (row: T) => string | number;

    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;

    page: number;           
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];  
    loading?: boolean;
    emptyHint?: string;
};

export default function SmartTable<T>({
    title,
    searchPlaceholder = "Buscar",
    initialSearch = "",
    filters = [],
    onSearch,
    onAdd,
    addLabel = "Nuevo",
    columns,
    rows,
    getRowId,
    onView,
    onEdit,
    onDelete,
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10],
    loading = false,
    emptyHint = "Sin registros",
}: SmartTableProps<T>) {
    const [q, setQ] = React.useState(initialSearch);
    const debounced = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (v: string) => {
        setQ(v);
        if (!onSearch) return;
        if (debounced.current) clearTimeout(debounced.current);
        debounced.current = setTimeout(() => onSearch(v), 400);
    };

    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Stack gap={2}>
            {/* Barra superior */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{title}</Typography>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <TextField
                        size="small"
                        placeholder={searchPlaceholder}
                        value={q}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 260 }}
                    />
                    {filters?.slice(0, 3).map((f, i) => (
                        <Box key={i}>{f}</Box>
                    ))}
                    {onAdd && (
                        <Button variant="contained" size="small" onClick={onAdd}>
                            {addLabel}
                        </Button>
                    )}
                </Stack>
            </Stack>

            {/* Tabla */}
            <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow sx={{ "& th": { bgcolor: "grey.900", color: "grey.100" } }}>
                            {columns.map((c) => (
                                <TableCell key={String(c.key)} align={c.align} sx={{ width: c.width }}>
                                    {c.header}
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ width: 120 }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading
                            ? Array.from({ length: pageSize }).map((_, i) => (
                                <TableRow key={`sk-${i}`}>
                                    {columns.map((c, j) => (
                                        <TableCell key={String(c.key) + j}>
                                            <Box sx={{ height: 18, bgcolor: "action.hover", borderRadius: 1 }} />
                                        </TableCell>
                                    ))}
                                    <TableCell />
                                </TableRow>
                            ))
                            : rows.length === 0
                                ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 1} align="center">
                                            {emptyHint}
                                        </TableCell>
                                    </TableRow>
                                )
                                : rows.map((row) => (
                                    <TableRow key={String(getRowId(row))} hover>
                                        {columns.map((c) => (
                                            <TableCell key={String(c.key)} align={c.align}>
                                                {c.render ? c.render(row) : (row as any)[c.key as any]}
                                            </TableCell>
                                        ))}
                                        <TableCell align="center">
                                            <Stack direction="row" justifyContent="center" gap={0.5}>
                                                <IconButton size="small" onClick={() => onView?.(row)} aria-label="ver">
                                                    <VisibilityOutlinedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => onEdit?.(row)} aria-label="editar">
                                                    <EditOutlinedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => onDelete?.(row)} aria-label="eliminar">
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                    </TableBody>
                </Table>
            </Box>

            {/* Pie de paginación */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Stack direction="row" alignItems="center" gap={1}>
                    <Typography variant="body2">Líneas por página</Typography>
                    <Select
                        size="small"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                    </Select>
                </Stack>

                <Pagination
                    page={page}
                    count={pageCount}
                    onChange={(_, p) => onPageChange(p)}
                    siblingCount={1}
                    boundaryCount={1}
                    size="small"
                />

                <Typography variant="body2">
                    Exhibiendo {from}-{to} de {total} registros
                </Typography>
            </Stack>
        </Stack>
    );
}
