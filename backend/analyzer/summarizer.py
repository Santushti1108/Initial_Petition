import os
import numpy as np
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk

_nltk_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'nltk_data')
if os.path.isdir(_nltk_data_dir):
    nltk.data.path.insert(0, _nltk_data_dir)

from nltk.tokenize import sent_tokenize


def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text


def clean_pdf_text(text):
    text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text)
    text = re.sub(r':::.*?:::', '', text)
    text = re.sub(r'Uploaded on\s+-\s+[\d/]+', '', text)
    text = re.sub(r'Downloaded on\s+-\s+[\d/\s:]+', '', text)
    text = re.sub(r'Digitally signed by.*?(?=\n[A-Z])', '', text, flags=re.DOTALL)
    text = re.sub(r'[A-Z]+\s+\d+,\s+\d{4}\n\w+\s+\w+\n', '', text)
    text = re.sub(r'sr\.\d+\s*&\s*\d+-[\w-]+\.doc', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


def extract_sentences(text):
    text = clean_pdf_text(text)
    sents = sent_tokenize(text)
    filtered = []
    for s in sents:
        s = s.strip()
        words = s.split()
        if len(words) < 5:
            continue
        if re.match(r'^(Page|AUGUST|Date:|Mansi|TRUSHA|:::)', s):
            continue
        filtered.append(s)
    return filtered


def build_similarity_matrix(sentences):
    cleaned = [clean_text(s).lower() for s in sentences]
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(cleaned)
    sim_matrix = cosine_similarity(tfidf_matrix)
    np.fill_diagonal(sim_matrix, 0)
    return sim_matrix


def rank_sentences(sim_matrix):
    sim_graph = nx.from_numpy_array(sim_matrix, create_using=nx.DiGraph)
    scores = nx.pagerank(sim_graph)
    return scores


def generate_summary(text, top_n=None):
    sentences = extract_sentences(text)
    if len(sentences) == 0:
        return ""
    if len(sentences) < 3:
        return text.strip()

    sim_matrix = build_similarity_matrix(sentences)
    scores = rank_sentences(sim_matrix)
    ranked = sorted(
        ((scores[i], i, s) for i, s in enumerate(sentences)),
        reverse=True
    )

    total_sentences = len(sentences)
    if top_n is None:
        if total_sentences <= 5:
            top_n = max(2, total_sentences - 1)
        elif total_sentences <= 15:
            top_n = max(3, int(total_sentences * 0.25))
        elif total_sentences <= 50:
            top_n = max(3, int(total_sentences * 0.06))
        else:
            top_n = min(5, max(3, int(total_sentences * 0.01)))

    top_sentences = sorted(ranked[:top_n], key=lambda x: x[1])
    summary = " ".join([s[2] for s in top_sentences])

    max_words = 120
    words = summary.split()
    if len(words) > max_words:
        summary = " ".join(words[:max_words]) + "..."

    return summary
