import numpy as np
import pandas as pd
from Bio import SeqIO
import os
def interquartile_range(arr, axis=None):
    Q75 = np.percentile(arr, 75, axis=axis)
    Q25 = np.percentile(arr, 25, axis=axis)
    IQR = Q75 - Q25
    return Q75, Q25, IQR

def read_protein_sequence(file_path):
    protein_sequence = str(SeqIO.read(file_path, "fasta").seq)
    return protein_sequence

def normalize_piwas_scores(cases, controls):
    med_i = np.median(controls)
    mad_i_u = np.median(np.abs(controls - med_i))
    if mad_i_u == 0:  # 防止除以0
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

def calculate_z_score(outlier_sum, controls, outlier_threshold):
    null_distribution = []
    for _ in range(1000):
        permuted_controls = np.random.permutation(controls)
        permuted_outlier_sum = np.sum((permuted_controls > outlier_threshold) * (permuted_controls - outlier_threshold))
        null_distribution.append(permuted_outlier_sum)
    mean = np.mean(null_distribution)
    std = np.std(null_distribution)
    z_score = (outlier_sum - mean) / std if std != 0 else 0
    return z_score

def run_pie(case_file_path, control_file_path, protein_file_path, result_dir):
    # 从FASTA文件读取基础蛋白质序列
    protein_sequence = read_protein_sequence(protein_file_path)

    # 读取病例组和对照组数据
    case_data = pd.read_csv(case_file_path)
    control_data = pd.read_csv(control_file_path)

    # 提取5-mer和6-mer的piwass_score
    piwass_5mer_case = case_data[['kmer_sequence_5mer', 'piwass_score']]
    piwass_6mer_case = case_data[['kmer_sequence_6mer', 'piwass_score']]
    piwass_5mer_control = control_data[['kmer_sequence_5mer', 'piwass_score']]
    piwass_6mer_control = control_data[['kmer_sequence_6mer', 'piwass_score']]

    cases_5 = piwass_5mer_case['piwass_score'].values
    cases_6 = piwass_6mer_case['piwass_score'].values
    controls_5 = piwass_5mer_control['piwass_score'].values
    controls_6 = piwass_6mer_control['piwass_score'].values

    control_z_scores = []

    # 处理长度为5的窗口
    for start_idx in range(len(protein_sequence) - 5 + 1):
        window_controls = controls_5[start_idx:start_idx + 5]
        
        if len(window_controls) == 5:
            normalized_window_controls, med_i, mad_i_u = normalize_piwas_scores(window_controls, window_controls)
            Q75, Q25, IQR = interquartile_range(window_controls)
            outlier_threshold_upper = calculate_outlier_threshold(Q75, Q25)
            outlier_sum = calculate_outlier_sum(normalized_window_controls, outlier_threshold_upper)
            z_score = calculate_z_score(outlier_sum, window_controls, outlier_threshold_upper)
            control_z_scores.append(z_score)

    # 处理长度为6的窗口
    for start_idx in range(len(protein_sequence) - 6 + 1):
        window_controls = controls_6[start_idx:start_idx + 6]
        
        if len(window_controls) == 6:
            normalized_window_controls, med_i, mad_i_u = normalize_piwas_scores(window_controls, window_controls)
            Q75, Q25, IQR = interquartile_range(window_controls)
            outlier_threshold_upper = calculate_outlier_threshold(Q75, Q25)
            outlier_sum = calculate_outlier_sum(normalized_window_controls, outlier_threshold_upper)
            z_score = calculate_z_score(outlier_sum, window_controls, outlier_threshold_upper)
            control_z_scores.append(z_score)

    if len(control_z_scores) > 0:
        z_score_threshold = np.percentile(control_z_scores, 95)
    else:
        z_score_threshold = float('nan')

    significant_regions_5 = []
    significant_regions_6 = []

    for start_idx in range(len(protein_sequence) - 5 + 1):
        window_cases = cases_5[start_idx:start_idx + 5]
        window_controls = controls_5[start_idx:start_idx + 5]
        
        if len(window_controls) == 5:
            normalized_window_cases, med_i, mad_i_u = normalize_piwas_scores(window_cases, window_controls)
            Q75, Q25, IQR = interquartile_range(window_controls)
            outlier_threshold_upper = calculate_outlier_threshold(Q75, Q25)
            outlier_sum = calculate_outlier_sum(normalized_window_cases, outlier_threshold_upper)
            z_score = calculate_z_score(outlier_sum, window_controls, outlier_threshold_upper)
            
            if z_score > z_score_threshold:
                significant_regions_5.append((start_idx, 5, protein_sequence[start_idx:start_idx + 5]))

    for start_idx in range(len(protein_sequence) - 6 + 1):
        window_cases = cases_6[start_idx:start_idx + 6]
        window_controls = controls_6[start_idx:start_idx + 6]
        
        if len(window_controls) == 6:
            normalized_window_cases, med_i, mad_i_u = normalize_piwas_scores(window_cases, window_controls)
            Q75, Q25, IQR = interquartile_range(window_controls)
            outlier_threshold_upper = calculate_outlier_threshold(Q75, Q25)
            outlier_sum = calculate_outlier_sum(normalized_window_cases, outlier_threshold_upper)
            z_score = calculate_z_score(outlier_sum, window_controls, outlier_threshold_upper)
            
            if z_score > z_score_threshold:
                significant_regions_6.append((start_idx, 6, protein_sequence[start_idx:start_idx + 6]))

    df_5mer = pd.DataFrame(significant_regions_5, columns=['Position', 'Length', 'Fragment'])
    df_6mer = pd.DataFrame(significant_regions_6, columns=['Position', 'Length', 'Fragment'])

    df_5mer.to_csv(os.path.join(result_dir, 'significant_regions_5mer.csv'), index=False)
    df_6mer.to_csv(os.path.join(result_dir, 'significant_regions_6mer.csv'), index=False)
