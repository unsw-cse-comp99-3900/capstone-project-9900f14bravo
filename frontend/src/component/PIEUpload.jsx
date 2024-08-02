import React from 'react';
import { Box, Typography, Grid, List, ListItem, ListItemText, IconButton, Select, MenuItem, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const PIEUpload = ({ fileSources, handleFileSourceChange, files, handleFileChange, handleFileDelete, handleDefaultFileSelect, defaultFiles }) => {
  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <div>
              <Typography>Upload Case File (1 CSV file)</Typography>
              <input
                type="file"
                name="caseSample"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'block', marginBottom: '10px' }}
              />
              <List>
                {files.caseSample.map((file, idx) => (
                  <ListItem key={idx} secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete('caseSample', idx)}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                    <ListItemText primary={file.name} />
                  </ListItem>
                ))}
              </List>
              {files.caseSample.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Selected {files.caseSample.length} case file
                </Typography>
              )}

              <Typography>Upload Control File (1 CSV file)</Typography>
              <input
                type="file"
                name="controlSample"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'block', marginBottom: '10px' }}
              />
              <List>
                {files.controlSample.map((file, idx) => (
                  <ListItem key={idx} secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete('controlSample', idx)}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                    <ListItemText primary={file.name} />
                  </ListItem>
                ))}
              </List>
              {files.controlSample.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Selected {files.controlSample.length} control file
                </Typography>
              )}
            </div>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography>Protein Sequence (1 fasta file)</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <RadioGroup
              row
              name="proteinSequence"
              value={fileSources.proteinSequence || 'local'}
              onChange={(e) => handleFileSourceChange(e, 'proteinSequence')}
            >
              <FormControlLabel value="local" control={<Radio />} label="Upload from local" />
              <FormControlLabel value="default" control={<Radio />} label="Select default file" />
            </RadioGroup>
          </Grid>
          <Grid item xs={12}>
            {fileSources.proteinSequence === 'local' ? (
              <div>
                <input
                  type="file"
                  name="proteinSequence"
                  accept=".fasta"
                  onChange={handleFileChange}
                  style={{ display: 'block', marginBottom: '10px' }}
                />
                <List>
                  {files.proteinSequence.map((file, idx) => (
                    <ListItem key={idx} secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete('proteinSequence', idx)}>
                        <DeleteIcon />
                      </IconButton>
                    }>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
                {files.proteinSequence.length > 0 && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Selected {files.proteinSequence.length} protein sequence file
                  </Typography>
                )}
              </div>
            ) : (
              <div>
                <Select
                  fullWidth
                  displayEmpty
                  onChange={(event) => handleDefaultFileSelect('proteinSequence', event.target.value)}
                  value={files.proteinSequence[0] || ''}
                  sx={{ height: 40 }}
                >
                  <MenuItem value="" disabled>Select a default file</MenuItem>
                  {defaultFiles.proteinSequence.map((file, index) => (
                    <MenuItem key={index} value={file}>{file}</MenuItem>
                  ))}
                </Select>
                {files.proteinSequence.length > 0 && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Selected default file: {files.proteinSequence[0]}
                  </Typography>
                )}
              </div>
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default PIEUpload;