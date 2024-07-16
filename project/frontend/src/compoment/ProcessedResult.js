import React from 'react';
import { Typography, Button, Box } from '@mui/material';

const ProcessedResult = ({ processedFile, downloadFile, handleReset, algorithm }) => {
  const getPlotImage = () => {
    if (algorithm === 'PIWAS' && processedFile.plot_file) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">PIWAS Plot:</Typography>
          <img
            src={`http://localhost:8000/media/PIWAS-result/piwas_plot.png`}
            alt="PIWAS Plot"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
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
      style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
    />
    <img
      src={`http://localhost:8000/media/PIWAS&PIE-result/pie_plot.png`}
      alt="PIE Plot"
      style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
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
            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <div>
      {processedFile && (
        <div>
          <Typography>Process completed. Download the result below:</Typography>
          {Object.keys(processedFile).map((key, index) => (
            <Button
              key={index}
              onClick={() => downloadFile(processedFile[key])}
              variant="contained"
              sx={{ mt: 2, mr: 2 }}
            >
              Download {key.replace('_', ' ')}
            </Button>
          ))}
          {getPlotImage()}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleReset}>
              New Pipeline
            </Button>
          </Box>
        </div>
      )}
    </div>
  );
};

export default ProcessedResult;
