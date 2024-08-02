import pandas as pd
import matplotlib.pyplot as plt
import os

def process_piwas_scores(file_path1, file_path2, result_dir):
    def process_file(file_path):
        df = pd.read_csv(file_path)
        results = []

        for index, row in df.iterrows():
            protein_sequence = row['kmer_sequence_6mer']
            kmer_sequence = row['kmer_sequence_5mer']
            piwass_score = row['IwasValue']
            results.append([protein_sequence, piwass_score])
            results.append([kmer_sequence, piwass_score])

        processed_results = []
        for item in results:
            sequence = item[0]
            score = item[1]
            split_sequence = ','.join(sequence)
            processed_results.append([split_sequence, score])

        final_results = []
        def average(lst):
            return sum(lst) / len(lst)

        for i in range(1, len(processed_results), 2):
            if i < len(processed_results):
                first_letter = processed_results[i][0][0]
                if i == 1:
                    scores = [processed_results[i - 1][1], processed_results[i][1]]
                elif i == 3:
                    scores = [processed_results[j][1] for j in range(i - 3, i + 1)]
                elif i == 5:
                    scores = [processed_results[j][1] for j in range(i - 5, i + 1)]
                elif i == 7:
                    scores = [processed_results[j][1] for j in range(i - 7, i + 1)]
                elif i == 9:
                    scores = [processed_results[j][1] for j in range(i - 9, i + 1)]
                else:
                    scores = [processed_results[j][1] for j in range(i - 11, i + 1)]
                avg_score = average(scores)
                scores_str = ', '.join(map(str, scores))
                final_results.append([first_letter, avg_score])

        last_item = processed_results[-1]
        last_scores = [processed_results[-i - 1][1] for i in range(11)]
        for k in range(5):
            letter = last_item[0][2 * k]
            avg_score = average(last_scores[-(2 * k + 1):])
            scores_str = ', '.join(map(str, last_scores[-(2 * k + 1):]))
            final_results.append([letter, avg_score])

        x_coords = list(range(1, len(final_results) + 1))
        y_coords = [item[1] for item in final_results]

        return x_coords, y_coords, [item[0] for item in final_results]

    x1, y1, labels1 = process_file(file_path1)
    x2, y2, labels2 = process_file(file_path2)

    os.makedirs(result_dir, exist_ok=True)
    plot_file_path = os.path.join(result_dir, 'piwas_plot.png')

    plt.switch_backend('Agg')  # Use non-GUI backend
    plt.figure(figsize=(14, 6))
    plt.plot(x1, y1, marker='o', markersize=3, linestyle='-', color='red', label='Case')
    plt.plot(x2, y2, marker='o', markersize=3, linestyle='-', color='blue', label='Controls')
    plt.xlabel('Aminoacid Position')
    plt.ylabel('Piwas Value')
    plt.title('Plot of Piwas Values for Cases and Controls')
    plt.grid(True)

    xtick_positions = range(0, len(x1), max(1, len(x1) // 20))
    plt.xticks(xtick_positions, xtick_positions, fontsize=6)

    plt.legend(loc='upper right')
    plt.tight_layout()
    plt.savefig(plot_file_path)
    plt.close()

    return plot_file_path