import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  command: string;
}

const ToolsList = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [open, setOpen] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    category: '',
    command: '',
  });

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const response = await axios.get('http://localhost:8000/tools/');
      setTools(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des outils:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/tools/', newTool);
      handleClose();
      fetchTools();
      setNewTool({ name: '', description: '', category: '', command: '' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'outil:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/tools/${id}`);
      fetchTools();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'outil:', error);
    }
  };

  const categories = ['Web', 'Pwn', 'Crypto', 'Forensics', 'Misc'];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      gap: 3,
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Typography variant="h4" component="h1">
          Outils CTF
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
            '&:hover': {
              background: 'linear-gradient(45deg, #4cff4c, #00ff00)',
            },
          }}
        >
          Ajouter un outil
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          flex: 1,
          background: 'rgba(45, 45, 45, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 0, 0.1)',
          overflow: 'auto',
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            '@media (max-width: 600px)': {
              padding: '8px 4px',
            },
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Commande</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tools.map((tool) => (
              <TableRow key={tool.id} hover>
                <TableCell>{tool.name}</TableCell>
                <TableCell>{tool.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={tool.category} 
                    color="primary" 
                    sx={{ 
                      background: 'rgba(0, 255, 0, 0.1)',
                      color: '#00ff00',
                      '&:hover': {
                        background: 'rgba(0, 255, 0, 0.2)',
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      color: '#00ff00',
                      background: 'rgba(0, 255, 0, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '300px',
                    }}
                  >
                    {tool.command}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifier">
                    <IconButton color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(tool.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: '#2d2d2d',
            border: '1px solid rgba(0, 255, 0, 0.1)',
          }
        }}
      >
        <DialogTitle>Ajouter un nouvel outil</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom"
              value={newTool.name}
              onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newTool.description}
              onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              select
              label="Catégorie"
              value={newTool.category}
              onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </TextField>
            <TextField
              label="Commande"
              value={newTool.command}
              onChange={(e) => setNewTool({ ...newTool, command: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4cff4c, #00ff00)',
              },
            }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ToolsList; 