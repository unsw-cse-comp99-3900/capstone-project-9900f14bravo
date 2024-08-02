import React from 'react';
import { Box, Typography, Grid, RadioGroup, FormControlLabel, Radio, Select, MenuItem, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const PIWASUpload = ({ fileSources, handleFileSourceChange, files, handleFileChange, handleFileDelete, handleDefaultFileSelect, defaultFiles }) => {

  return (
    <>
      <Box sx={{ mt: 2 }}>
        <Typography>Case/Control Samples</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <RadioGroup
              row
              name="caseControlSample"
              value={fileSources.caseControlSample || 'local'} 
              onChange={(e) => handleFileSourceChange(e, 'caseControlSample')}
            >
              <FormControlLabel value="local" control={<Radio />} label="Choose from local" />
              <FormControlLabel value="default" control={<Radio />} label="Choose from library" />
            </RadioGroup>
          </Grid>
          <Grid item xs={12}>
            {fileSources.caseControlSample === 'local' ? (
              <div>
                <Typography>Upload Case Files (2 CSV files)</Typography>
                <input
                  type="file"
                  name="caseSample"
                  multiple
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
                    Selected {files.caseSample.length} case files
                  </Typography>
                )}
                
                <Typography>Upload Control Files (2 CSV files)</Typography>
                <input
                  type="file"
                  name="controlSample"
                  multiple
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
                    Selected {files.controlSample.length} control files
                  </Typography>
                )}
              </div>
            ) : (
              <div>
                <Select
                  fullWidth
                  displayEmpty
                  onChange={(event) => handleDefaultFileSelect('caseSample', event.target.value)}
                  value={files.caseSample[0] || ''}
                  sx={{ height: 40 }}
                >
                  <MenuItem value="" disabled>Select a case/control file pair</MenuItem>
                  {Object.keys(defaultFiles.caseSample).map((caseFile, index) => (
                    <MenuItem key={index} value={caseFile}>
                      {caseFile} / {defaultFiles.caseSample[caseFile]}
                    </MenuItem>
                  ))}
                </Select>
                {files.caseSample.length > 0 && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Selected default case file: {files.caseSample[0]}, control file: {defaultFiles['caseSample'][files.caseSample[0]]}
                  </Typography>
                )}
              </div>
            )}
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
              <FormControlLabel value="local" control={<Radio />} label="Choose from local" />
              <FormControlLabel value="default" control={<Radio />} label="Choose from library" />
            </RadioGroup>
          </Grid>
          <Grid item xs={12}>
            {fileSources.proteinSequence === 'local' ? (
              <div>
                <Typography>Upload Protein Sequence File</Typography>
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
                  <MenuItem value="" disabled>Select a default protein sequence file</MenuItem>
                  {defaultFiles.proteinSequence.map((file, index) => (
                    <MenuItem key={index} value={file}>{file}</MenuItem>
                  ))}
                </Select>
                {files.proteinSequence.length > 0 && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Selected default protein sequence file: {files.proteinSequence[0]}
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

export default PIWASUpload;