import os
import numpy as np
import pandas as pd
from scipy.stats import norm
import openpyxl
def interquartile_range(arr, axis=None):
    Q75 = np.percentile(arr, 75, axis=axis)
    Q25 = np.percentile(arr, 25, axis=axis)
    IQR = Q75 - Q25
    return Q75, Q25, IQR

def normalize_piwas_scores(cases, controls):
    med_i = np.median(controls)
    mad_i_u = np.median(np.abs(controls - med_i))
    if mad_i_u == 0:  
        mad_i_u = 1
    normalized_cases = (cases - med_i) / mad_i_u
    return normalized_cases, med_i, mad_i_u

def calculate_outlier_threshold(Q75, Q25):
    IQR = Q75 - Q25
    outlier_threshold_upper = Q75 + 1.5 * IQR
    return outlier_threshold_upper

def calculate_outlier_sum(normalized_cases, outlier_threshold):
    outlier_sum = np.sum((normalized_cases > outlier_threshold) * (normalized_cases - outlier_threshold))
    return outlier_sum

def calculate_z_score(outlier_sum, case_values, control_values, threshold, n_iterations=1000):
    null_distribution = []
    combined_values = np.concatenate((case_values, control_values))
    n_case = len(case_values)
    
    for _ in range(n_iterations):
        permuted_values = np.random.permutation(combined_values)
        permuted_case_values = permuted_values[:n_case]
        normalized_permuted_case_values, _, _ = normalize_piwas_scores(permuted_case_values, control_values)
        permuted_outlier_sum = calculate_outlier_sum(normalized_permuted_case_values, threshold)
        null_distribution.append(permuted_outlier_sum)
    
    mean_null = np.mean(null_distribution)
    std_null = np.std(null_distribution)
    z_score = (outlier_sum - mean_null) / std_null if std_null != 0 else np.nan
    z_score = 0 if np.isnan(z_score) or z_score == 0 else z_score
    return z_score

def calculate_p_value(z_score):
    p_value = 2 * (1 - norm.cdf(abs(z_score)))
    return p_value

def run_pie(piwas_case_file_path, piwas_control_file_path, protein_file_path, result_dir):
    # Load the case and control data
    case_data = pd.read_csv(piwas_case_file_path)
    control_data = pd.read_csv(piwas_control_file_path)

    # check the columns
    required_columns = ['AminoAcidPosition', 'IwasValue']
    for col in required_columns:
        if col not in case_data.columns or col not in control_data.columns:
            raise ValueError(f"CSV file is missing required column: {col}")
        
    # Prepare data structures
    positions = case_data['AminoAcidPosition'].unique()
    results = []

    # Iterate over each position
    for pos in positions:
        case_values = case_data[case_data['AminoAcidPosition'] == pos]['IwasValue'].values
        control_values = control_data[control_data['AminoAcidPosition'] == pos]['IwasValue'].values

        if len(control_values) == 0 or len(case_values) == 0:
            results.append((pos, 0, 0, 1))  
            continue

        # Step 1: Normalize PIWAS scores
        normalized_case_values, med_i, mad_i_u = normalize_piwas_scores(case_values, control_values)

        # Step 2: Calculate outlier threshold
        Q75, Q25, IQR = interquartile_range(control_values)
        outlier_threshold = calculate_outlier_threshold(Q75, Q25)

        # Step 3: Calculate outlier sum
        outlier_sum = calculate_outlier_sum(normalized_case_values, outlier_threshold)

        # Step 4: Calculate Z-score
        z_score = calculate_z_score(outlier_sum, case_values, control_values, outlier_threshold)

        # Step 5: Calculate P-value
        p_value = calculate_p_value(z_score)

        results.append((pos, case_values[0], z_score, p_value))

    # Convert results to DataFrame for better visualization
    results_df = pd.DataFrame(results, columns=['AminoAcidPosition', 'IwasValue', 'ZScore', 'PValue'])
    top_5_percent = results_df[results_df['PValue'] <= results_df['PValue'].quantile(0.05)]

    # Save the resulting DataFrame to CSV and Excel files
    results_output_file_path_csv = os.path.join(result_dir, 'total_results_output.csv')
    results_output_file_path_excel = os.path.join(result_dir, 'total_results_output.xlsx')
    top_5_percent_output_file_path_csv = os.path.join(result_dir, 'top_5_percent_output.csv')
    top_5_percent_output_file_path_excel = os.path.join(result_dir, 'top_5_percent_output.xlsx')

    results_df.to_csv(results_output_file_path_csv, index=False)
    top_5_percent.to_csv(top_5_percent_output_file_path_csv, index=False)
    results_df.to_excel(results_output_file_path_excel, index=False)
    top_5_percent.to_excel(top_5_percent_output_file_path_excel, index=False)

    return {
        'total_results_csv': results_output_file_path_csv,
        'total_results_excel': results_output_file_path_excel,
        'top_5_percent_csv': top_5_percent_output_file_path_csv,
        'top_5_percent_excel': top_5_percent_output_file_path_excel
    }
