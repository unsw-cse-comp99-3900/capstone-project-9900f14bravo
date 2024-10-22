import pandas as pd
from collections import defaultdict
import numpy as np
import os
import re
import openpyxl

# Read 5-mer and 6-mer enrichment data
def read_kmer_data(file_path):
    try:
        kmer_data = pd.read_csv(file_path, header=None, names=['kmer_sequence', 'enrichment_value'])
        if kmer_data.shape[1] != 2:
            raise ValueError("CSV file must have exactly two columns: 'kmer_sequence' and 'enrichment_value'")
        if not kmer_data['kmer_sequence'].apply(lambda x: isinstance(x, str)).all():
            raise ValueError("The 'kmer_sequence' column must contain strings")
        if not pd.api.types.is_numeric_dtype(kmer_data['enrichment_value']):
            raise ValueError("The 'enrichment_value' column must contain numeric values")
        return kmer_data
    except pd.errors.ParserError:
        raise ValueError("Error parsing the CSV file")
    except Exception as e:
        raise ValueError(f"An error occurred while reading the CSV file: {str(e)}")

# Read protein sequence from a file
def read_protein_sequence(file_path):
    with open(file_path, 'r') as file:
        lines = file.read().splitlines()
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
            scores.append(max(window_scores))
            kmer_list.append(protein_sequence[i:i + kmer_length])
        else:
            scores.append(0)
            kmer_list.append(protein_sequence[i:i + kmer_length])
    return scores, kmer_list

def run_piwas(case_file_paths, control_file_paths, protein_file_path, result_dir):
    try:
        case_kmer_5_data = read_kmer_data(case_file_paths['kmer_5'])
        case_kmer_6_data = read_kmer_data(case_file_paths['kmer_6'])
        case_protein_sequence = read_protein_sequence(protein_file_path)

        control_kmer_5_data = read_kmer_data(control_file_paths['kmer_5'])
        control_kmer_6_data = read_kmer_data(control_file_paths['kmer_6'])
    except ValueError as e:
        return {'error': str(e)}

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
        'AminoAcidPosition': list(range(1, len(piwas_scores_case) + 1)),
        'kmer_sequence_5mer': kmer_list_5mer_case[:len(piwas_scores_case)],
        'kmer_sequence_6mer': kmer_list_6mer_case[:len(piwas_scores_case)]
    }

    # Construct output data in the required format for control
    output_data_control = {
        'ProteinName': ['>sp|P0DTC9|NCAP_SARS2 Nucleocapsid phosphoprotein OS=Severe acute respiratory syndrome coronavirus 2 OX=2697049 GN=N PE=1 SV=1'] * len(piwas_scores_control),
        'SampleID': [sample_id_control] * len(piwas_scores_control),
        'IwasValue': piwas_scores_control,
        'AminoAcidPosition': list(range(1, len(piwas_scores_control) + 1)),
        'kmer_sequence_5mer': kmer_list_5mer_control[:len(piwas_scores_control)],
        'kmer_sequence_6mer': kmer_list_6mer_control[:len(piwas_scores_control)]
    }

    output_df_case = pd.DataFrame(output_data_case)
    output_df_control = pd.DataFrame(output_data_control)

    case_file_name_csv = f'{sample_id_case}_piwas_scores_case.csv'
    control_file_name_csv = f'{sample_id_control}_piwas_scores_control.csv'
    case_file_name_excel = f'{sample_id_case}_piwas_scores_case.xlsx'
    control_file_name_excel = f'{sample_id_control}_piwas_scores_control.xlsx'

    # Write PIWAS scores to CSV files
    case_file_path_csv = os.path.join(result_dir, case_file_name_csv)
    control_file_path_csv = os.path.join(result_dir, control_file_name_csv)
    output_df_case.to_csv(case_file_path_csv, index=False)
    output_df_control.to_csv(control_file_path_csv, index=False)

    # Write PIWAS scores to Excel files
    case_file_path_excel = os.path.join(result_dir, case_file_name_excel)
    control_file_path_excel = os.path.join(result_dir, control_file_name_excel)
    output_df_case.to_excel(case_file_path_excel, index=False)
    output_df_control.to_excel(control_file_path_excel, index=False)

    return {
        'case_csv': case_file_name_csv,
        'control_csv': control_file_name_csv,
        'case_excel': case_file_name_excel,
        'control_excel': control_file_name_excel
    }
