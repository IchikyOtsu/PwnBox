import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Typography,
    Box,
    Menu,
    MenuItem,
    ListItemSecondaryAction,
    Button,
} from '@mui/material';
import {
    Note as NoteIcon,
    Star,
    StarBorder,
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { Note } from '../../types/note';

interface NoteListProps {
    notes: Note[];
    onNoteSelect: (note: Note) => void;
    onNoteDelete: (noteId: number) => void;
    onNoteEdit: (note: Note) => void;
    onNoteFavorite: (noteId: number, isFavorite: boolean) => void;
    onCreateNote: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({
    notes,
    onNoteSelect,
    onNoteDelete,
    onNoteEdit,
    onNoteFavorite,
    onCreateNote,
}) => {
    const [contextMenu, setContextMenu] = React.useState<{
        mouseX: number;
        mouseY: number;
        noteId: number | null;
    }>({
        mouseX: 0,
        mouseY: 0,
        noteId: null,
    });

    const handleContextMenu = (event: React.MouseEvent, noteId: number) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            noteId,
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu({
            mouseX: 0,
            mouseY: 0,
            noteId: null,
        });
    };

    if (notes.length === 0) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography color="text.secondary">Aucune note dans ce carnet</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateNote}
                >
                    Créer une note
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateNote}
                    size="small"
                >
                    Nouvelle note
                </Button>
            </Box>
            <List>
                {notes.map((note) => (
                    <ListItem
                        key={note.id}
                        button
                        onClick={() => onNoteSelect(note)}
                        onContextMenu={(e) => handleContextMenu(e, note.id)}
                    >
                        <ListItemIcon>
                            <NoteIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={note.title}
                            secondary={
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {note.content.replace(/[#*`]/g, '')}
                                </Typography>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNoteFavorite(note.id, !note.is_favorite);
                                }}
                            >
                                {note.is_favorite ? <Star color="primary" /> : <StarBorder />}
                            </IconButton>
                            <IconButton
                                edge="end"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNoteEdit(note);
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Menu
                open={contextMenu.mouseY !== 0}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu.mouseY !== 0 && contextMenu.mouseX !== 0
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem
                    onClick={() => {
                        if (contextMenu.noteId) {
                            const note = notes.find(n => n.id === contextMenu.noteId);
                            if (note) onNoteEdit(note);
                        }
                        handleCloseContextMenu();
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    Modifier
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (contextMenu.noteId) {
                            onNoteDelete(contextMenu.noteId);
                        }
                        handleCloseContextMenu();
                    }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    Supprimer
                </MenuItem>
            </Menu>
        </Box>
    );
}; 