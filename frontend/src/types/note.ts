export interface Folder {
    id: number;
    name: string;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    children?: Folder[];
    notes?: Note[];
}

export interface Note {
    id: number;
    title: string;
    content: string;
    tags: string[];
    is_favorite: boolean;
    folder_id: number | null;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    children?: Note[];
} 