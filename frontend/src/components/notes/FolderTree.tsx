import React, { useState, useEffect } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    ListItemButton,
} from '@mui/material';
import {
    Folder as FolderIcon,
    Note as NoteIcon,
    MoreVert as MoreVertIcon,
    CreateNewFolder as CreateNewFolderIcon,
    Create as CreateIcon,
    Delete as DeleteIcon,
    ExpandMore,
    ChevronRight,
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Folder, Note } from '../../types/note';

interface FolderTreeProps {
    folders: Folder[];
    notes: Note[];
    onFolderSelect: (folder: Folder) => void;
    onNoteSelect: (note: Note) => void;
    onCreateFolder: (parentId: number | null) => void;
    onCreateNote: (folderId: number | null) => void;
    onFolderMove: (folderId: number, newParentId: number | null) => void;
    onFolderDelete: (folderId: number) => void;
}

interface DraggableItemProps {
    id: number;
    type: string;
    children: React.ReactNode;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, type, children }) => {
    const [{ isDragging }, drag] = useDrag({
        type,
        item: { id, type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div ref={drag as any} style={{ opacity: isDragging ? 0.5 : 1 }}>
            {children}
        </div>
    );
};

interface DroppableFolderProps {
    id: number;
    children: React.ReactNode;
    onFolderMove: (folderId: number, newParentId: number | null) => void;
}

const DroppableFolder: React.FC<DroppableFolderProps> = ({ id, children, onFolderMove }) => {
    const [{ isOver }, drop] = useDrop({
        accept: ['folder', 'note'],
        drop: (item: { id: number, type: string }) => {
            if (item.type === 'folder') {
                onFolderMove(item.id, id);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div ref={drop as any} style={{ background: isOver ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
            {children}
        </div>
    );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
    folders,
    notes,
    onFolderSelect,
    onNoteSelect,
    onCreateFolder,
    onCreateNote,
    onFolderMove,
    onFolderDelete,
}) => {
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        folderId: number | null;
    }>({
        mouseX: 0,
        mouseY: 0,
        folderId: null,
    });

    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

    const handleContextMenu = (event: React.MouseEvent, folderId: number | null) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            folderId,
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu({
            mouseX: 0,
            mouseY: 0,
            folderId: null,
        });
    };

    const toggleFolder = (folderId: number) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
    };

    const renderFolder = (folder: Folder, level: number = 0) => {
        const childFolders = folders.filter(f => f.parent_id === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const hasSubFolders = childFolders.length > 0;

        return (
            <DroppableFolder key={folder.id} id={folder.id} onFolderMove={onFolderMove}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <ListItemButton
                        onClick={() => {
                            onFolderSelect(folder);
                            if (hasSubFolders) {
                                toggleFolder(folder.id);
                            }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, folder.id)}
                        sx={{ 
                            pl: hasSubFolders ? level * 2 : level * 2 + 4,
                            minHeight: 40,
                            py: 0
                        }}
                    >
                        {hasSubFolders && (
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {isExpanded ? <ExpandMore /> : <ChevronRight />}
                            </ListItemIcon>
                        )}
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <FolderIcon />
                        </ListItemIcon>
                        <ListItemText primary={folder.name} />
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, folder.id);
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </ListItemButton>

                    {isExpanded && hasSubFolders && (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
                        </Box>
                    )}
                </Box>
            </DroppableFolder>
        );
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <Box sx={{ width: '100%' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="h6">Dossiers</Typography>
                    <IconButton onClick={() => onCreateFolder(null)} size="small">
                        <CreateNewFolderIcon />
                    </IconButton>
                </Box>

                <List sx={{ py: 0 }}>
                    {folders
                        .filter(folder => !folder.parent_id)
                        .map(folder => renderFolder(folder))}
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
                            onCreateFolder(contextMenu.folderId);
                            handleCloseContextMenu();
                        }}
                    >
                        <ListItemIcon>
                            <CreateNewFolderIcon fontSize="small" />
                        </ListItemIcon>
                        Nouveau dossier
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            onCreateNote(contextMenu.folderId);
                            handleCloseContextMenu();
                        }}
                    >
                        <ListItemIcon>
                            <CreateIcon fontSize="small" />
                        </ListItemIcon>
                        Nouvelle note
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            if (contextMenu.folderId) {
                                onFolderDelete(contextMenu.folderId);
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
        </DndProvider>
    );
}; 