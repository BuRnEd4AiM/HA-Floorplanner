"""tools/tokens.py: counts the tokens of a Claude session from its transcript and adds all sessions up into docs/TOKENS.md."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import tokens as tk  # noqa: E402


def reply(mid, model="claude-opus-5-5", out=10, read=100, write=5, inp=1, ts="2026-10-18T10:00:00Z"):
    return json.dumps({"type": "assistant", "timestamp": ts, "requestId": "r" + mid, "message": {
        "id": mid, "model": model, "usage": {"input_tokens": inp, "cache_creation_input_tokens": write,
                                             "cache_read_input_tokens": read, "output_tokens": out}}})


def test_every_reply_counts_once_per_model():
    lines = [json.dumps({"type": "user", "timestamp": "2026-10-17T23:59:00Z"}),
             reply("a"), reply("a"), reply("a"),                 # one reply, logged once per content block
             reply("b", out=20, read=200), "not json",
             reply("c", model="claude-haiku-5-5", out=1, read=0, write=0),
             reply("d", model="<synthetic>", out=99)]
    totals, models, first = tk.count(lines)
    assert totals == {"input": 3, "cache_write": 10, "cache_read": 300, "output": 31}
    assert models["claude-opus-5-5"]["requests"] == 2 and models["claude-haiku-5-5"]["output"] == 1
    assert "<synthetic>" not in models and first == "2026-10-17T23:59:00Z"


def test_only_git_commit_is_a_commit():
    for c in ("git commit -m x", "git add -A && git commit -m 'x'", "git -C /repo commit --amend", "cd a; git -c a=b commit"):
        assert tk.is_commit(c), c
    for c in ("git commit-tree abc", "git log --grep commit", "git status", "echo commit", "", None):
        assert not tk.is_commit(c), c


def test_record_never_counts_down(tmp_path, monkeypatch):
    monkeypatch.setattr(tk, "DIR", tmp_path / "tokens")
    monkeypatch.setattr(tk, "branch", lambda: "claude/x")
    t = tmp_path / "s.jsonl"
    t.write_text("\n".join([reply("a"), reply("b")]))
    (tmp_path / "s" / "subagents").mkdir(parents=True)
    (tmp_path / "s" / "subagents" / "agent-1.jsonl").write_text(reply("h", out=1000))
    p = tk.record("session_x", t, now="2026-10-18T11:00:00Z")
    rec = json.loads(p.read_text())
    assert rec["output"] == 1020 and rec["start"] == "2026-10-18" and rec["branch"] == "claude/x" and rec["source"] == "counted"
    t.write_text(reply("a"))                                     # a shorter transcript after a restart
    (tmp_path / "s" / "subagents" / "agent-1.jsonl").unlink()
    tk.record("session_x", t)
    assert json.loads(p.read_text())["output"] == 1020


def test_hook_ignores_other_commands_and_repositories(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(tk, "record", lambda *a: calls.append(a) or Path("x"))
    monkeypatch.setattr(tk, "stage", lambda p: None)
    t = tmp_path / "s.jsonl"
    t.write_text(reply("a"))
    base = {"tool_name": "Bash", "transcript_path": str(t), "session_id": "abc", "cwd": str(tk.ROOT)}
    tk.hook({**base, "tool_input": {"command": "git status"}})
    tk.hook({**base, "cwd": str(tmp_path), "tool_input": {"command": "git commit -m x"}})
    assert calls == []
    tk.hook({**base, "tool_input": {"command": "git commit -m x"}})
    assert len(calls) == 1


def test_fmt_is_german():
    assert [tk.fmt(n) for n in (740, 12_300, 3_562_191, 1_227_710_689)] == ["740", "12 Tsd.", "3,6 Mio.", "1,23 Mrd."]


def test_summary_adds_up_and_marks_estimates():
    recs = [{"session": "session_01AAAAAAAAAAAAAAA", "start": "2026-10-18", "branch": "claude/a", "source": "counted",
             "input": 1, "cache_write": 9, "cache_read": 1_000_000_000, "output": 2_000_000},
            {"session": "estimate-other-accounts", "start": "2026-09-29", "source": "estimate", "sessions": 13,
             "title": "anderer Zugang", "input": 0, "cache_write": 0, "cache_read": 2_000_000_000, "output": 0}]
    md = tk.summary(recs, today="2026-10-18")
    assert "14 Sitzungen" in md and "**Insgesamt: 3,00 Mrd. Tokens** (davon 2,00 Mrd. geschätzt)" in md
    assert "| 2026-10 | 1 | 1,00 Mrd. | 2,0 Mio. |\n| geschätzt | 13 | 2,00 Mrd. | 0 |" in md
    assert "(https://claude.ai/code/session_01AAAAAAAAAAAAAAA)" in md and "13 Sitzungen: anderer Zugang" in md


def test_count_files_are_valid():
    for rec in tk.load():
        assert rec["session"] and rec["source"] in tk.SOURCES, rec
        assert all(isinstance(rec.get(f), int) and rec[f] >= 0 for f in tk.FIELDS), rec
