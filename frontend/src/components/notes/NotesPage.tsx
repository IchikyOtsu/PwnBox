import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Divider, IconButton } from '@mui/material';
import { FolderTree } from './FolderTree';
import { NoteList } from './NoteList';
import { NoteEditor } from './NoteEditor';
import { NoteTabs } from './NoteTabs';
import { Note, Folder } from '../../types/note';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Edit as EditIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

export const NotesPage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [openNotes, setOpenNotes] = useState<Note[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchNotes = async () => {
        try {
            const response = await fetch(`${API_URL}/notes`);
            const data = await response.json();
            setNotes(data);
        } catch (error) {
            console.error('Erreur lors du chargement des notes:', error);
        }
    };

    const fetchFolders = async () => {
        try {
            const response = await fetch(`${API_URL}/folders`);
            const data = await response.json();
            setFolders(data);
        } catch (error) {
            console.error('Erreur lors du chargement des dossiers:', error);
        }
    };

    useEffect(() => {
        fetchNotes();
        fetchFolders();
    }, []);

    const handleNoteSelect = (note: Note) => {
        if (!openNotes.find(n => n.id === note.id)) {
            setOpenNotes([...openNotes, note]);
        }
        setActiveNoteId(note.id);
        setIsEditing(false);
    };

    const handleNoteClose = (noteId: number) => {
        setOpenNotes(openNotes.filter(n => n.id !== noteId));
        if (activeNoteId === noteId) {
            const remainingNotes = openNotes.filter(n => n.id !== noteId);
            setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[remainingNotes.length - 1].id : null);
        }
    };

    const handleNoteEdit = (note: Note) => {
        handleNoteSelect(note);
        setIsEditing(true);
    };

    const handleAutoSave = async (noteData: Partial<Note>) => {
        try {
            const activeNote = openNotes.find(n => n.id === activeNoteId);
            const effectiveFolderId = noteData.folder_id !== undefined ? noteData.folder_id : selectedFolder?.id || null;
            
            if (activeNote && activeNote.id !== -1) {
                await fetch(`${API_URL}/notes/${activeNote.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...noteData,
                        folder_id: effectiveFolderId,
                    }),
                });
            } else {
                const response = await fetch(`${API_URL}/notes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...noteData,
                        folder_id: effectiveFolderId,
                    }),
                });
                const newNote = await response.json();
                setOpenNotes(prev => prev.map(n => n.id === -1 ? newNote : n));
                setActiveNoteId(newNote.id);
            }
            await fetchNotes();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la note:', error);
        }
    };

    const handleNoteDelete = async (noteId: number) => {
        try {
            await fetch(`${API_URL}/notes/${noteId}`, {
                method: 'DELETE',
            });
            fetchNotes();
            handleNoteClose(noteId);
        } catch (error) {
            console.error('Erreur lors de la suppression de la note:', error);
        }
    };

    const handleNoteFavorite = async (noteId: number, isFavorite: boolean) => {
        try {
            const note = notes.find(n => n.id === noteId);
            if (note) {
                await fetch(`${API_URL}/notes/${noteId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...note,
                        is_favorite: isFavorite,
                    }),
                });
                fetchNotes();
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la note:', error);
        }
    };

    const handleCreateNote = (folderId: number | null = null) => {
        const effectiveFolderId = folderId !== null ? folderId : selectedFolder?.id || null;
        const newNote: Note = {
            id: -1, // Temporaire
            title: 'Nouvelle note',
            content: '',
            tags: [],
            is_favorite: false,
            folder_id: effectiveFolderId,
            parent_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setOpenNotes([...openNotes, newNote]);
        setActiveNoteId(-1);
        setIsEditing(true);
    };

    const handleFolderSelect = (folder: Folder) => {
        setSelectedFolder(folder);
    };

    const handleCreateFolder = async (parentId: number | null) => {
        try {
            const name = prompt('Nom du nouveau carnet:');
            if (name) {
                await fetch(`${API_URL}/folders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        parent_id: parentId,
                    }),
                });
                fetchFolders();
            }
        } catch (error) {
            console.error('Erreur lors de la création du carnet:', error);
        }
    };

    const handleFolderMove = async (folderId: number, newParentId: number | null) => {
        try {
            await fetch(`${API_URL}/folders/${folderId}/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ new_parent_id: newParentId }),
            });
            fetchFolders();
        } catch (error) {
            console.error('Erreur lors du déplacement du carnet:', error);
        }
    };

    const handleFolderDelete = async (folderId: number) => {
        try {
            await fetch(`${API_URL}/folders/${folderId}`, {
                method: 'DELETE',
            });
            fetchFolders();
            if (selectedFolder?.id === folderId) {
                setSelectedFolder(null);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du carnet:', error);
        }
    };

    const filteredNotes = selectedFolder
        ? notes.filter(note => note.folder_id === selectedFolder.id)
        : notes.filter(note => !note.folder_id);

    const activeNote = openNotes.find(note => note.id === activeNoteId);

    return (
        <Box sx={{ height: '100vh', display: 'flex' }}>
            <Box sx={{ width: 250, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
                <FolderTree
                    folders={folders}
                    notes={notes}
                    onFolderSelect={handleFolderSelect}
                    onNoteSelect={handleNoteSelect}
                    onCreateFolder={handleCreateFolder}
                    onCreateNote={handleCreateNote}
                    onFolderMove={handleFolderMove}
                    onFolderDelete={handleFolderDelete}
                />
            </Box>
            <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
                <NoteList
                    notes={filteredNotes}
                    onNoteSelect={handleNoteSelect}
                    onNoteDelete={handleNoteDelete}
                    onNoteEdit={handleNoteEdit}
                    onNoteFavorite={handleNoteFavorite}
                    onCreateNote={() => handleCreateNote(selectedFolder?.id || null)}
                />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <NoteTabs
                    openNotes={openNotes}
                    activeNoteId={activeNoteId}
                    onNoteSelect={handleNoteSelect}
                    onNoteClose={handleNoteClose}
                />
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {activeNote && (
                        isEditing ? (
                            <NoteEditor
                                note={activeNote}
                                onSave={handleAutoSave}
                                autoSave={true}
                            />
                        ) : (
                            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <h2>{activeNote.title}</h2>
                                    <IconButton onClick={() => setIsEditing(true)}>
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    {activeNote.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            style={{
                                                marginRight: '8px',
                                                padding: '4px 8px',
                                                backgroundColor: '#e0e0e0',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </Box>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                >
                                    {activeNote.content}
                                </ReactMarkdown>
                            </Box>
                        )
                    )}
                </Box>
            </Box>
        </Box>
    );
}; 