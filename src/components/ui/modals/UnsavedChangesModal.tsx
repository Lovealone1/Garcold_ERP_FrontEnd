import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export default function UnsavedChangesModal({ open, onClose, onConfirm }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{
                paper: {
                    sx: { borderRadius: 2, border: "1px solid var(--panel-border)", bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)" }
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
                Cambios sin guardar
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ color: "var(--tg-muted)", fontSize: "0.95rem" }}>
                    Tienes cambios en esta página que no se han guardado. ¿Estás seguro de que deseas salir? Los datos actuales se perderán.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: "var(--tg-muted)", textTransform: "none" }}>
                    Cancelar
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained" disableElevation sx={{ textTransform: "none" }}>
                    Salir sin guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
