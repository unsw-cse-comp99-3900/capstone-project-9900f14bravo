import React from 'react';
import { Box, Typography, Grid, RadioGroup, FormControlLabel, Radio, Select, MenuItem, IconButton, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

const FileUpload = ({
  fileType,
  fileSources,
  files,
  defaultFiles,
  handleFileSourceChange,
  handleFileChange,
  handleDefaultFileSelect,
  handleFileDelete,
  handleFileView,
  uploadedFiles
}) => (
  <Box sx={{ mt: 2 }}>
    <Typography>{fileType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={6}>
        <RadioGroup
          row
          name={fileType}
          value={fileSources[fileType]}
          onChange={(e) => handleFileSourceChange(e, fileType)}
        >
          <FormControlLabel value="local" control={<Radio />} label="Upload from local" />
          <FormControlLabel value="default" control={<Radio />} label="Select default file" />
        </RadioGroup>
      </Grid>
      <Grid item xs={6}>
        {fileSources[fileType] === 'local' ? (
          <input
            type="file"
            name={fileType}
            onChange={handleFileChange}
            style={{ display: 'block', marginTop: '10px' }}
          />
        ) : (
          <Select
            fullWidth
            displayEmpty
            onChange={(event) => handleDefaultFileSelect(fileType, event.target.value)}
            value={files[fileType] || ''}
            sx={{ height: 40 }}
          >
            <MenuItem value="" disabled>Select a default file</MenuItem>
            {defaultFiles[fileType].map((file, index) => (
              <MenuItem key={index} value={file}>{file}</MenuItem>
            ))}
          </Select>
        )}
      </Grid>
    </Grid>
    <List sx={{ mt: 3 }}>
      {uploadedFiles.filter(file => file.fileType === fileType).map((file, index) => (
        <React.Fragment key={index}>
          <ListItem>
            <ListItemText
              primary={file.name || file}
              secondary={file.size !== undefined ? formatFileSize(file.size) : ''}
            />
            <IconButton edge="end" aria-label="view" onClick={() => handleFileView(file)}>
              <Visibility />
            </IconButton>
            <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete(file)}>
              <Delete />
            </IconButton>
          </ListItem>
          {index < uploadedFiles.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  </Box>
);

const formatFileSize = (size) => {
  if (size === null) return '';
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
};

export default FileUpload;