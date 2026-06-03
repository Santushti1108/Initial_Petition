import os
import re
import nltk

_nltk_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'nltk_data')
if os.path.isdir(_nltk_data_dir):
    nltk.data.path.insert(0, _nltk_data_dir)

from nltk.tokenize import sent_tokenize

POSITIVE_LEGAL_KEYWORDS = [
    'granted', 'upheld', 'justified', 'valid', 'lawful', 'constitutional',
    'compliant', 'entitled', 'merit', 'reasonable', 'proper', 'legitimate',
    'established', 'proved', 'substantiated', 'supported', 'maintainable',
    'admissible', 'binding', 'enforceable', 'rights', 'remedy', 'relief',
    'protection', 'safeguard', 'guarantee', 'justice', 'fair', 'equitable',
    'statutory', 'precedent', 'authority', 'jurisdiction', 'competent',
    'favorable', 'approved', 'affirmed', 'sustained', 'permitted', 'allowed',
    'accordance', 'compliance', 'duly', 'properly', 'correctly'
]

NEGATIVE_LEGAL_KEYWORDS = [
    'denied', 'rejected', 'dismissed', 'violation', 'breach', 'unlawful',
    'unconstitutional', 'illegal', 'void', 'invalid', 'defective', 'irregular',
    'arbitrary', 'malafide', 'mala fide', 'frivolous', 'vexatious', 'abuse',
    'failure', 'negligence', 'misconduct', 'prejudice', 'discrimination',
    'harassment', 'oppression', 'infringement', 'encroachment', 'deprivation',
    'contravention', 'non-compliance', 'default', 'delay', 'overreach',
    'without jurisdiction', 'ultra vires', 'coercion', 'fraud', 'misrepresentation',
    'suppression', 'concealment', 'wrongful', 'improper', 'unjust', 'unfair',
    'barred', 'prohibited', 'impermissible', 'inadmissible'
]


def classify_sentence(sentence):
    lower = sentence.lower()
    pos_score = sum(1 for kw in POSITIVE_LEGAL_KEYWORDS if kw in lower)
    neg_score = sum(1 for kw in NEGATIVE_LEGAL_KEYWORDS if kw in lower)

    if pos_score > neg_score:
        return 'positive'
    elif neg_score > pos_score:
        return 'negative'
    return 'neutral'


def analyze_sentiment(text):
    sentences = sent_tokenize(text)
    positive, negative, neutral = [], [], []

    for sent in sentences:
        sent = sent.strip()
        if len(sent.split()) < 3:
            continue
        classification = classify_sentence(sent)
        if classification == 'positive':
            positive.append(sent)
        elif classification == 'negative':
            negative.append(sent)
        else:
            neutral.append(sent)

    total = len(positive) + len(negative) + len(neutral)
    if total == 0:
        return {
            'positive': [],
            'negative': [],
            'neutral': [],
            'positive_pct': 0,
            'negative_pct': 0,
            'neutral_pct': 0,
            'overall': 'neutral'
        }

    pos_pct = round((len(positive) / total) * 100, 1)
    neg_pct = round((len(negative) / total) * 100, 1)
    neu_pct = round((len(neutral) / total) * 100, 1)

    if pos_pct > neg_pct:
        overall = 'positive'
    elif neg_pct > pos_pct:
        overall = 'negative'
    else:
        overall = 'neutral'

    return {
        'positive': positive,
        'negative': negative,
        'neutral': neutral,
        'positive_pct': pos_pct,
        'negative_pct': neg_pct,
        'neutral_pct': neu_pct,
        'overall': overall
    }
