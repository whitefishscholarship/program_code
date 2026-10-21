"""Extract observed destinations without turning display labels into targets."""
import re

def observed_targets(text):
    links=list(re.finditer(r'\[[^\]\n]*\]\((https?://[^)\s]+)\)', text))
    targets=[m.group(1) for m in links]
    remainder=text
    for m in reversed(links):
        remainder=remainder[:m.start()]+' '*(m.end()-m.start())+remainder[m.end():]
    targets.extend(m.group(0).rstrip('.,;') for m in re.finditer(r'https?://[^\s)]+',remainder))
    return list(dict.fromkeys(targets))

def is_redacted(target):
    return any(marker in target for marker in ['<','>','PRIVATE_','[REDACTED]'])
