import React, { useState } from 'react';
import { Typography, Button, Box, Select, MenuItem, FormControl, InputLabel, Paper, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ProcessedResult = ({ processedFile, downloadFile, handleReset, algorithm }) => {
  const [fileType, setFileType] = useState('csv');
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const handleFileTypeChange = (event) => {
    setFileType(event.target.value);
  };

  const handleDownloadZip = () => {
    downloadFile(fileType);
  };

  const handleClickOpen = (image) => {
    setSelectedImage(image);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedImage('');
  };

  const getPlotImage = () => {
    if (algorithm === 'PIWAS' && processedFile.plot_file) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">PIWAS Plot:</Typography>
          <img
            src={`http://localhost:8000/media/PIWAS-result/piwas_plot.png`}
            alt="PIWAS Plot"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
            onClick={() => handleClickOpen(`http://localhost:8000/media/PIWAS-result/piwas_plot.png`)}
          />
        </Box>
      );
    } else if (algorithm === 'PIWAS+PIE' && processedFile.plot_file1 && processedFile.plot_file2) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">PIWAS&PIE Plot:</Typography>
          <img
            src={`http://localhost:8000/media/PIWAS&PIE-result/piwas_plot.png`}
            alt="PIWAS Plot"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', marginBottom: '16px' }}
            onClick={() => handleClickOpen(`http://localhost:8000/media/PIWAS&PIE-result/piwas_plot.png`)}
          />
          <img
            src={`http://localhost:8000/media/PIWAS&PIE-result/pie_plot.png`}
            alt="PIE Plot"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
            onClick={() => handleClickOpen(`http://localhost:8000/media/PIWAS&PIE-result/pie_plot.png`)}
          />
        </Box>
      );
    } else if (algorithm === 'PIE' && processedFile.plot_file) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">PIE Plot:</Typography>
          <img
            src={`http://localhost:8000/media/PIE-result/pie_plot.png`}
            alt="PIE Plot"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
            onClick={() => handleClickOpen(`http://localhost:8000/media/PIE-result/pie_plot.png`)}
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ padding: '16px', marginTop: '16px' }}>
      {processedFile && (
        <div>
          <Typography variant="h6" sx={{ mb: 2 }}>Result visualization</Typography>
          {getPlotImage()}
          <Box sx={{ mt: 5, display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={handleDownloadZip}
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
            >
              Download ZIP
            </Button>
            <FormControl variant="standard" sx={{minWidth: 140}}>
              <InputLabel id="file-type-label">File Type </InputLabel>
              <Select
                labelId="file-type-label"
                id="file-type-select"
                value={fileType}
                onChange={handleFileTypeChange}
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="secondary" onClick={handleReset}>
              New Pipeline
            </Button>
          </Box>
        </div>
      )}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        PaperProps={{ style: { position: 'relative' } }}
      >
        <IconButton
          onClick={handleClose}
          style={{ position: 'absolute', top: 8, right: 8, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <CloseIcon />
        </IconButton>
        <img
          src={selectedImage}
          alt="Selected Plot"
          style={{ width: '100%', maxHeight: '90vh', objectFit: 'contain' }}
        />
      </Dialog>
    </Paper>
  );
};

export default ProcessedResult;