import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, ListItemIcon, IconButton, Typography } from '@mui/material';
import { Note as NoteIcon, Star, StarBorder, Delete, Edit } from '@mui/icons-material';
import { Note } from '../../types/note';

interface NotesListProps {
    notes: Note[];
    onNoteSelect: (note: Note) => void;
    onNoteDelete: (noteId: number) => void;
    onNoteEdit: (note: Note) => void;
    onNoteFavorite: (noteId: number, isFavorite: boolean) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
    notes,
    onNoteSelect,
    onNoteDelete,
    onNoteEdit,
    onNoteFavorite,
}) => {
    return (
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            <List>
                {notes.map((note) => (
                    <ListItem
                        key={note.id}
                        button
                        onClick={() => onNoteSelect(note)}
                        secondaryAction={
                            <Box>
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
                                    <Edit />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNoteDelete(note.id);
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        }
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
                                    {note.content}
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}; 