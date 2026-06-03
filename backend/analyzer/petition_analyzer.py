import re
from .summarizer import generate_summary
from .sentiment import analyze_sentiment


LEGAL_SECTIONS = {
    'parties': [
        r'petitioner', r'respondent', r'plaintiff', r'defendant',
        r'appellant', r'applicant', r'complainant'
    ],
    'jurisdiction': [
        r'jurisdiction', r'article\s+\d+', r'section\s+\d+',
        r'under\s+the\s+constitution', r'high\s+court', r'supreme\s+court',
        r'district\s+court', r'civil\s+court', r'criminal\s+court',
        r'writ\s+petition', r'civil\s+appeal', r'criminal\s+appeal'
    ],
    'facts': [
        r'facts\s+of\s+the\s+case', r'brief\s+facts', r'material\s+facts',
        r'background', r'statement\s+of\s+facts'
    ],
    'grounds': [
        r'grounds?', r'contentions?', r'submissions?', r'arguments?',
        r'on\s+the\s+grounds?\s+that'
    ],
    'prayer': [
        r'prayer', r'relief', r'remedy', r'prays?', r'seeks?',
        r'humbly\s+pray', r'wherefore'
    ],
    'legal_provisions': [
        r'section\s+\d+', r'article\s+\d+', r'rule\s+\d+',
        r'order\s+\w+', r'clause\s+\d+', r'act,?\s+\d{4}',
        r'code\s+of', r'constitution\s+of\s+india'
    ],
    'case_references': [
        r'v\.\s', r'vs\.?\s', r'versus', r'cited\s+in',
        r'\(\d{4}\)\s+\d+\s+SCC', r'AIR\s+\d{4}',
        r'decided\s+on', r'reported\s+in'
    ],
    'verification': [
        r'verification', r'verified', r'solemnly\s+affirm',
        r'oath', r'affidavit', r'deponent', r'notary'
    ]
}

CRITICAL_ELEMENTS = {
    'cause_of_action': {
        'patterns': [r'cause\s+of\s+action', r'arose\s+on', r'accrued\s+on'],
        'description': 'Cause of action with specific dates',
        'severity': 'critical'
    },
    'limitation': {
        'patterns': [r'limitation', r'within\s+\d+\s+(days|months|years)',
                     r'time[\s-]barred', r'prescribed\s+period'],
        'description': 'Limitation period compliance',
        'severity': 'critical'
    },
    'locus_standi': {
        'patterns': [r'locus\s+standi', r'standing', r'aggrieved\s+person',
                     r'affected\s+party'],
        'description': 'Locus standi (standing to sue)',
        'severity': 'high'
    },
    'res_judicata': {
        'patterns': [r'res\s+judicata', r'previously\s+adjudicated',
                     r'already\s+decided'],
        'description': 'Res judicata check',
        'severity': 'high'
    },
    'proper_forum': {
        'patterns': [r'territorial\s+jurisdiction', r'pecuniary\s+jurisdiction',
                     r'subject[\s-]matter\s+jurisdiction', r'proper\s+forum',
                     r'appropriate\s+court'],
        'description': 'Proper forum/court selection',
        'severity': 'high'
    },
    'vakalatnama': {
        'patterns': [r'vakalatnama', r'power\s+of\s+attorney',
                     r'authorized\s+representative', r'advocate\s+on\s+record'],
        'description': 'Vakalatnama/Authorization',
        'severity': 'medium'
    },
    'court_fees': {
        'patterns': [r'court\s+fee', r'stamp', r'ad\s+valorem'],
        'description': 'Court fee payment',
        'severity': 'medium'
    }
}


def detect_sections(text):
    lower = text.lower()
    found = {}
    missing = {}

    for section, patterns in LEGAL_SECTIONS.items():
        matches = []
        for p in patterns:
            if re.search(p, lower):
                matches.append(p)
        if matches:
            found[section] = True
        else:
            missing[section] = True

    return found, missing


def detect_critical_elements(text):
    lower = text.lower()
    present = {}
    absent = {}

    for element, info in CRITICAL_ELEMENTS.items():
        found = False
        for p in info['patterns']:
            if re.search(p, lower):
                found = True
                break
        if found:
            present[element] = info
        else:
            absent[element] = info

    return present, absent


def extract_legal_provisions(text):
    provisions = []

    section_matches = re.findall(
        r'[Ss]ection\s+(\d+[A-Za-z]?)\s+(?:of\s+(?:the\s+)?)?([A-Z][A-Za-z\s,]+(?:Act|Code),?\s*\d{4})',
        text
    )
    for match in section_matches:
        provisions.append(f"Section {match[0]} of {match[1].strip()}")

    article_matches = re.findall(
        r'[Aa]rticle\s+(\d+[A-Za-z]?(?:\(\d+\))?)\s+(?:of\s+(?:the\s+)?)?([A-Z][A-Za-z\s]+)',
        text
    )
    for match in article_matches:
        provisions.append(f"Article {match[0]} of {match[1].strip()}")

    return list(set(provisions))


def extract_case_citations(text):
    citations = []

    scc_pattern = re.findall(r'\(\d{4}\)\s+\d+\s+SCC\s+\d+', text)
    citations.extend(scc_pattern)

    air_pattern = re.findall(r'AIR\s+\d{4}\s+\w+\s+\d+', text)
    citations.extend(air_pattern)

    vs_pattern = re.findall(
        r'([A-Z][A-Za-z\s.]+)\s+(?:v\.|vs\.?|versus)\s+([A-Z][A-Za-z\s.]+)',
        text
    )
    for match in vs_pattern:
        citations.append(f"{match[0].strip()} vs. {match[1].strip()}")

    return list(set(citations))


def calculate_court_viability(text, found_sections, missing_sections,
                               present_elements, absent_elements, sentiment):
    score = 50
    issues = []
    strengths = []

    section_count = len(found_sections)
    total_sections = section_count + len(missing_sections)
    if total_sections > 0:
        coverage = section_count / total_sections
        score += int(coverage * 15)

    if 'parties' in found_sections:
        strengths.append("Parties are properly identified")
        score += 3
    else:
        issues.append("Parties (petitioner/respondent) are not clearly identified")
        score -= 8

    if 'jurisdiction' in found_sections:
        strengths.append("Jurisdictional basis is stated")
        score += 3
    else:
        issues.append("Jurisdictional basis is missing - the court may not entertain the petition")
        score -= 10

    if 'facts' in found_sections:
        strengths.append("Facts of the case are presented")
        score += 3
    else:
        issues.append("Statement of facts is missing or unclear")
        score -= 5

    if 'grounds' in found_sections:
        strengths.append("Legal grounds/contentions are stated")
        score += 3
    else:
        issues.append("Grounds/contentions are not clearly articulated")
        score -= 7

    if 'prayer' in found_sections:
        strengths.append("Prayer/Relief clause is present")
        score += 5
    else:
        issues.append("Prayer/Relief section is missing - court won't know what relief to grant")
        score -= 10

    if 'legal_provisions' in found_sections:
        strengths.append("Legal provisions are cited")
        score += 3
    else:
        issues.append("No specific legal provisions (sections/articles) are cited")
        score -= 5

    if 'case_references' in found_sections:
        strengths.append("Case law references strengthen the petition")
        score += 5
    else:
        issues.append("No case law citations - citing precedents would strengthen the petition")
        score -= 3

    if 'verification' in found_sections:
        strengths.append("Verification/Affidavit is included")
        score += 3
    else:
        issues.append("Verification/Affidavit clause is missing")
        score -= 4

    for element, info in absent_elements.items():
        if info['severity'] == 'critical':
            score -= 8
            issues.append(f"CRITICAL: {info['description']} is not addressed")
        elif info['severity'] == 'high':
            score -= 5
            issues.append(f"HIGH: {info['description']} is not addressed")
        else:
            score -= 2
            issues.append(f"MEDIUM: {info['description']} is not addressed")

    for element, info in present_elements.items():
        strengths.append(f"{info['description']} is addressed")

    if sentiment['negative_pct'] > 60:
        issues.append("Petition language is overly negative/accusatory - may affect judicial reception")
        score -= 3
    if sentiment['positive_pct'] > 40:
        strengths.append("Petition maintains constructive legal language")
        score += 2

    word_count = len(text.split())
    if word_count < 200:
        issues.append("Petition appears too brief - may lack necessary detail")
        score -= 5
    elif word_count > 10000:
        issues.append("Petition is excessively long - consider condensing arguments")
        score -= 2

    score = max(5, min(95, score))

    if score >= 70:
        verdict = "LIKELY TO STAND"
        verdict_detail = "This petition has a reasonable foundation and addresses most key legal requirements. With the suggested improvements, its chances would be even stronger."
    elif score >= 45:
        verdict = "NEEDS IMPROVEMENT"
        verdict_detail = "This petition has some merit but has significant gaps that could lead to rejection. The issues identified below should be addressed before filing."
    else:
        verdict = "UNLIKELY TO STAND"
        verdict_detail = "This petition has serious structural and legal deficiencies. It would likely be dismissed on procedural grounds alone. Major revisions are required."

    return {
        'score': score,
        'verdict': verdict,
        'verdict_detail': verdict_detail,
        'issues': issues,
        'strengths': strengths
    }


def analyze_petition(text):
    if not text or len(text.strip()) < 50:
        return {
            'error': 'The uploaded document appears to be too short or empty. Please upload a valid petition document.'
        }

    summary = generate_summary(text)
    sentiment = analyze_sentiment(text)
    found_sections, missing_sections = detect_sections(text)
    present_elements, absent_elements = detect_critical_elements(text)
    provisions = extract_legal_provisions(text)
    citations = extract_case_citations(text)
    viability = calculate_court_viability(
        text, found_sections, missing_sections,
        present_elements, absent_elements, sentiment
    )

    word_count = len(text.split())
    sentence_count = len(text.split('.'))

    return {
        'summary': summary,
        'sentiment': sentiment,
        'sections': {
            'found': list(found_sections.keys()),
            'missing': list(missing_sections.keys())
        },
        'critical_elements': {
            'present': {k: v['description'] for k, v in present_elements.items()},
            'absent': {k: {'description': v['description'], 'severity': v['severity']}
                       for k, v in absent_elements.items()}
        },
        'legal_provisions': provisions,
        'case_citations': citations,
        'viability': viability,
        'stats': {
            'word_count': word_count,
            'sentence_count': sentence_count,
            'sections_found': len(found_sections),
            'sections_total': len(LEGAL_SECTIONS),
            'provisions_cited': len(provisions),
            'cases_cited': len(citations)
        }
    }
