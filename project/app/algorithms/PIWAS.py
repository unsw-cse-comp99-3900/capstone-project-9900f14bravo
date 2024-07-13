import pandas as pd
from collections import defaultdict
import numpy as np
import os
import re
# Read 5-mer and 6-mer enrichment data
def read_kmer_data(file_path):
    kmer_data = pd.read_csv(file_path, header=None, names=['kmer_sequence', 'enrichment_value'])
    return kmer_data

# Read protein sequence from a file
def read_protein_sequence(file_path):
    with open(file_path, 'r') as file:
        lines = file.read().splitlines()
    # Remove description lines and concatenate the remaining lines to form the protein sequence
    protein_sequence = ''.join([line for line in lines if not line.startswith('>')])
    return protein_sequence

# Extract sample ID from the file name
def extract_sample_id(file_path):
    file_name = os.path.basename(file_path)
    match = re.search(r'AD\d+', file_name)  
    if match:
        return match.group(0)  
    return None

# Calculate enrichment values from kmer data
def calculate_enrichment(kmer_data):
    enrichment_dict = defaultdict(float)
    for index, row in kmer_data.iterrows():
        kmer = row['kmer_sequence']
        enrichment_value = row['enrichment_value']
        enrichment_dict[kmer] = enrichment_value
    return enrichment_dict

# Normalize the case enrichment values using control enrichment values
def normalize_enrichment(case_enrichment, control_enrichment):
    normalized_enrichment = defaultdict(float)
    control_mean = np.mean(list(control_enrichment.values()))
    control_std = np.std(list(control_enrichment.values()))
    for kmer in case_enrichment:
        if kmer in control_enrichment:
            if control_std != 0:
                normalized_enrichment[kmer] = (case_enrichment[kmer] - control_mean) / control_std
            else:
                normalized_enrichment[kmer] = case_enrichment[kmer] - control_mean
        else:
            normalized_enrichment[kmer] = case_enrichment[kmer]
    return normalized_enrichment

# Calculate PIWAS scores for the given protein sequence and enrichment dictionary
def calculate_piwass_score(protein_sequence, enrichment_dict, kmer_length, window_size):
    scores = []
    kmer_list = []
    for i in range(len(protein_sequence) - kmer_length + 1):
        window_scores = []
        for j in range(max(0, i - window_size // 2), min(len(protein_sequence) - kmer_length + 1, i + window_size // 2 + 1)):
            kmer = protein_sequence[j:j + kmer_length]
            if kmer in enrichment_dict:
                window_scores.append(enrichment_dict[kmer])
        if window_scores:
            scores.append(max(window_scores))  # Use the maximum score within the window
            kmer_list.append(protein_sequence[i:i + kmer_length])
        else:
            scores.append(0)
            kmer_list.append(protein_sequence[i:i + kmer_length])
    return scores, kmer_list

def run_piwas(case_file_paths, control_file_paths, protein_file_path, result_dir):
    case_kmer_5_data = read_kmer_data(case_file_paths['kmer_5'])
    case_kmer_6_data = read_kmer_data(case_file_paths['kmer_6'])
    case_protein_sequence = read_protein_sequence(protein_file_path)

    control_kmer_5_data = read_kmer_data(control_file_paths['kmer_5'])
    control_kmer_6_data = read_kmer_data(control_file_paths['kmer_6'])

    sample_id_case = extract_sample_id(case_file_paths['kmer_5'])
    sample_id_control = extract_sample_id(control_file_paths['kmer_5'])

    case_enrichment_5mer = calculate_enrichment(case_kmer_5_data)
    case_enrichment_6mer = calculate_enrichment(case_kmer_6_data)
    control_enrichment_5mer = calculate_enrichment(control_kmer_5_data)
    control_enrichment_6mer = calculate_enrichment(control_kmer_6_data)

    normalized_enrichment_5mer = normalize_enrichment(case_enrichment_5mer, control_enrichment_5mer)
    normalized_enrichment_6mer = normalize_enrichment(case_enrichment_6mer, control_enrichment_6mer)

    piwas_scores_5mer_case, kmer_list_5mer_case = calculate_piwass_score(case_protein_sequence, normalized_enrichment_5mer, 5, 10)
    piwas_scores_6mer_case, kmer_list_6mer_case = calculate_piwass_score(case_protein_sequence, normalized_enrichment_6mer, 6, 10)
    piwas_scores_5mer_control, kmer_list_5mer_control = calculate_piwass_score(case_protein_sequence, control_enrichment_5mer, 5, 10)
    piwas_scores_6mer_control, kmer_list_6mer_control = calculate_piwass_score(case_protein_sequence, control_enrichment_6mer, 6, 10)

    piwas_scores_case = np.maximum(piwas_scores_5mer_case[:len(piwas_scores_6mer_case)], piwas_scores_6mer_case)
    piwas_scores_control = np.maximum(piwas_scores_5mer_control[:len(piwas_scores_6mer_control)], piwas_scores_6mer_control)

    # Construct output data in the required format for case
    output_data_case = {
        'ProteinName': ['>sp|P0DTC9|NCAP_SARS2 Nucleocapsid phosphoprotein OS=Severe acute respiratory syndrome coronavirus 2 OX=2697049 GN=N PE=1 SV=1'] * len(piwas_scores_case),
        'SampleID': [sample_id_case] * len(piwas_scores_case),
        'IwasValue': piwas_scores_case,
        'AminoAcidPosition': list(range(1, len(piwas_scores_case) + 1))
    }

    # Construct output data in the required format for control
    output_data_control = {
        'ProteinName': ['>sp|P0DTC9|NCAP_SARS2 Nucleocapsid phosphoprotein OS=Severe acute respiratory syndrome coronavirus 2 OX=2697049 GN=N PE=1 SV=1'] * len(piwas_scores_control),
        'SampleID': [sample_id_control] * len(piwas_scores_control),
        'IwasValue': piwas_scores_control,
        'AminoAcidPosition': list(range(1, len(piwas_scores_control) + 1))
    }

    output_df_case = pd.DataFrame(output_data_case)
    output_df_control = pd.DataFrame(output_data_control)

    case_file_name = f'{sample_id_case}_piwas_scores_case.csv'
    control_file_name = f'{sample_id_control}_piwas_scores_control.csv'

    # Write PIWAS scores to CSV files
    case_file_path = os.path.join(result_dir, case_file_name)
    control_file_path = os.path.join(result_dir, control_file_name)
    output_df_case.to_csv(case_file_path, index=False)
    output_df_control.to_csv(control_file_path, index=False)

    return case_file_name, control_file_name
