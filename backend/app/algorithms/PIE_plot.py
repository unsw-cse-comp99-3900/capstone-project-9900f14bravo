import pandas as pd
import matplotlib.pyplot as plt
import os

def plot_protein_data(csv_file_a, csv_file_b, result_dir):
    data_a = pd.read_csv(csv_file_a)
    data_b = pd.read_csv(csv_file_b)

    amino_acid_position_a = data_a.filter(like='AminoAcidPosition').values.flatten()
    iwas_value = data_a.filter(like='IwasValue').values.flatten()

    amino_acid_position_b = data_b.filter(like='AminoAcidPosition').values.flatten()
    p_value = data_b.filter(like='PValue').values.flatten()

    plt.switch_backend('Agg')
    os.makedirs(result_dir, exist_ok=True)
    plot_file_path = os.path.join(result_dir, 'pie_plot.png')
    fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True, figsize=(10, 6), gridspec_kw={'height_ratios': [3, 1]})

    ax1.plot(amino_acid_position_a, iwas_value, marker='o', linestyle='-', markersize=1)
    ax1.set_ylabel('Iwas Value')

    for position, p_val in zip(amino_acid_position_b, p_value):
        linewidth = max(p_val * 2, 1)  
        ax2.plot([position, position], [0, 1], color='blueviolet', linewidth=linewidth)

    ax2.set_xlabel('Amino Acid Position')
    ax2.set_yticks([])

    plt.tight_layout()
    plt.savefig(plot_file_path)
    plt.close()

    return plot_file_path

