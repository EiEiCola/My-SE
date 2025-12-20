import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "./PollCreate.css";
import { pollAPI } from "../../../../services/http/poll";

type OptionForm = {
  label: string;
  hasImage: boolean;
  img_url: string;
};

type PollForm = {
  question: string;
  allow_multiple: boolean;
  max_choice: number | null;
  start_at: string | null; // datetime-local string
  end_at: string | null;

  main_category_id: number | null;
  sub_category_l1_id: number | null;
  sub_category_l2_id: number | null;

  options: OptionForm[];
};

const emptyForm: PollForm = {
  question: "",
  allow_multiple: false,
  max_choice: null,
  start_at: null,
  end_at: null,

  main_category_id: null,
  sub_category_l1_id: null,
  sub_category_l2_id: null,

  options: [
    { label: "", hasImage: false, img_url: "" },
    { label: "", hasImage: false, img_url: "" },
  ],
};

function toDatetimeLocal(value: any): string | null {
  if (!value) return null;
  const d = dayjs(value);
  if (!d.isValid()) return null;
  return d.format("YYYY-MM-DDTHH:mm");
}

function toISOOrNull(dtLocal: string | null): string | null {
  if (!dtLocal) return null;
  const d = dayjs(dtLocal);
  if (!d.isValid()) return null;
  return d.toISOString();
}

const PollCreate: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const pollId = Number(params.id || 0);
  const isEdit = !!pollId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pollStatusID, setPollStatusID] = useState<number | null>(null);
  const [form, setForm] = useState<PollForm>(emptyForm);

  const optionCount = form.options.length;
  const canShowMaxChoice = form.allow_multiple;
  const maxChoiceLimit = optionCount;

  const errors = useMemo(() => {
    const e: string[] = [];

    if (!form.question.trim()) e.push("Question is required");

    const nonEmptyOptions = form.options.filter((o) => o.label.trim() !== "");
    if (nonEmptyOptions.length < 2) e.push("At least 2 options are required");

    const labels = nonEmptyOptions.map((o) => o.label.trim().toLowerCase());
    const dup = labels.some((v, i) => labels.indexOf(v) !== i);
    if (dup) e.push("Duplicate option labels are not allowed");

    if (form.allow_multiple) {
      if (!form.max_choice || form.max_choice < 2) {
        e.push("Max choice must be at least 2 when allow multiple is enabled");
      } else if (form.max_choice > optionCount) {
        e.push("Max choice cannot exceed number of options");
      }
    }

    const s = form.start_at ? dayjs(form.start_at) : null;
    const en = form.end_at ? dayjs(form.end_at) : null;
    if (s && en && s.isValid() && en.isValid() && en.isBefore(s)) {
      e.push("End time must be after start time");
    }

    return e;
  }, [form, optionCount]);

  const draftWarnings = useMemo(() => {
    const w: string[] = [];
    if (!form.question.trim()) w.push("Draft: question is empty");
    const filled = form.options.filter((o) => o.label.trim() !== "");
    if (filled.length < 2) w.push("Draft: recommended to have at least 2 options");
    return w;
  }, [form]);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      setLoading(true);
      try {
        const res = await (pollAPI as any).getMyPollByID(pollId);
        const data = (res as any)?.data ?? res;

        const question = data?.question ?? "";
        const allow_multiple = !!(data?.allow_multiple ?? false);
        const max_choice = data?.max_choice ?? null;

        const start_at = toDatetimeLocal(data?.start_at);
        const end_at = toDatetimeLocal(data?.end_at);

        const main_category_id = data?.main_category_id ?? null;
        const sub_category_l1_id = data?.sub_category_l1_id ?? null;
        const sub_category_l2_id = data?.sub_category_l2_id ?? null;

        const opts = (data?.options ?? []).map((o: any) => {
          const img = o?.img_url ?? o?.ImgURL ?? "";
          return {
            label: o?.label ?? "",
            hasImage: !!img,
            img_url: img || "",
          } as OptionForm;
        });

        setPollStatusID(Number(data?.poll_status_id ?? data?.StatusID ?? null));

        setForm({
          question,
          allow_multiple,
          max_choice: max_choice === null ? null : Number(max_choice),
          start_at,
          end_at,
          main_category_id: main_category_id === null ? null : Number(main_category_id),
          sub_category_l1_id: sub_category_l1_id === null ? null : Number(sub_category_l1_id),
          sub_category_l2_id: sub_category_l2_id === null ? null : Number(sub_category_l2_id),
          options: opts.length ? opts : emptyForm.options,
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load poll for edit");
        navigate("/User/Polls/my");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, pollId]);

  const setField = <K extends keyof PollForm>(key: K, value: PollForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setOption = (idx: number, patch: Partial<OptionForm>) => {
    setForm((prev) => {
      const next = [...prev.options];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, options: next };
    });
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { label: "", hasImage: false, img_url: "" }],
    }));
  };

  const removeOption = (idx: number) => {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev;
      const next = prev.options.filter((_, i) => i !== idx);

      let nextMax = prev.max_choice;
      if (prev.allow_multiple && nextMax && nextMax > next.length) nextMax = next.length;

      return { ...prev, options: next, max_choice: nextMax };
    });
  };

  const moveOption = (from: number, to: number) => {
    setForm((prev) => {
      if (to < 0 || to >= prev.options.length) return prev;
      const next = [...prev.options];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...prev, options: next };
    });
  };

  const buildPayload = () => {
    return {
      question: form.question,
      allow_multiple: form.allow_multiple,
      max_choice: form.allow_multiple ? form.max_choice : null,
      start_at: toISOOrNull(form.start_at),
      end_at: toISOOrNull(form.end_at),

      main_category_id: form.main_category_id || null,
      sub_category_l1_id: form.sub_category_l1_id || null,
      sub_category_l2_id: form.sub_category_l2_id || null,

      options: form.options.map((o, i) => ({
        label: o.label,
        img_url: o.hasImage ? (o.img_url || "") : "",
        sort_order: i + 1,
      })),
    };
  };

 const saveDraft = async (): Promise<number> => {
  const payload = buildPayload();

  if (!isEdit) {
    const res = await (pollAPI as any).createDraft(payload); // ✅ เปลี่ยนจาก saveDraft -> createDraft
    const data = (res as any)?.data ?? res;
    return Number(data?.id ?? data?.ID ?? 0);
  } else {
    const res = await (pollAPI as any).updateDraft(pollId, payload);
    const data = (res as any)?.data ?? res;
    return Number(data?.id ?? data?.ID ?? pollId);
  }
};


  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      if (draftWarnings.length) {
        // eslint-disable-next-line no-restricted-globals
        const ok = confirm(`Save draft with warnings?\n\n- ${draftWarnings.join("\n- ")}`);
        if (!ok) {
          setSubmitting(false);
          return;
        }
      }

      const id = await saveDraft();
      alert("Saved draft successfully");
      if (!isEdit && id) navigate(`/User/Polls/edit/${id}`);
    } catch (err) {
      console.error(err);
      alert("Save draft failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (errors.length) {
      alert(`Cannot submit:\n\n- ${errors.join("\n- ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const id = await saveDraft();
      if (!id) throw new Error("poll id not found after save");

      await (pollAPI as any).submitForReview(id);

      alert("Submitted for review successfully");
      navigate("/User/Polls/my");
    } catch (err) {
      console.error(err);
      alert("Submit for review failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="pc-loading">Loading...</div>;

  return (
    <div className="pc-page">
      <div className="pc-topbar">
        <div>
          <div className="pc-title">{isEdit ? "Edit Poll" : "Create Poll"}</div>
          <div className="pc-subtitle">
            Flow: Save Draft → Submit for Admin Review → (Admin Approve) → Published
          </div>

          {isEdit && pollStatusID !== null && (
            <div className="pc-statusline">Current Status ID: {pollStatusID}</div>
          )}
        </div>

        <button type="button" className="pc-btn pc-btn-back" onClick={() => navigate("/User/Polls/my")}>
          ← Back
        </button>
      </div>

      <div className="pc-card">
        <div className="pc-section">
          <div className="pc-label">Question</div>
          <input
            className="pc-input"
            value={form.question}
            onChange={(e) => setField("question", e.target.value)}
            placeholder="Enter your poll question..."
          />
        </div>

        <div className="pc-grid2">
          <div className="pc-panel">
            <div className="pc-panel-title">Allow multiple choices</div>
            <div className="pc-panel-sub">
              If enabled, user can pick more than 1 option.
            </div>

            <div className="pc-checkrow">
              <input
                type="checkbox"
                checked={form.allow_multiple}
                onChange={(e) => {
                  const v = e.target.checked;
                  setField("allow_multiple", v);
                  if (!v) setField("max_choice", null);
                  if (v && !form.max_choice) setField("max_choice", 2);
                }}
              />
              <span className="pc-checktext">{form.allow_multiple ? "Enabled" : "Disabled"}</span>
            </div>

            {canShowMaxChoice && (
              <div className="pc-subsection">
                <div className="pc-label">Max choice</div>
                <input
                  className="pc-input"
                  type="number"
                  min={2}
                  max={maxChoiceLimit}
                  value={form.max_choice ?? ""}
                  onChange={(e) => setField("max_choice", e.target.value ? Number(e.target.value) : null)}
                  placeholder="2"
                />
                <div className="pc-hint">Max = number of options ({maxChoiceLimit})</div>
              </div>
            )}
          </div>

          <div className="pc-panel">
            <div className="pc-panel-title">Time range (optional)</div>
            <div className="pc-panel-sub">
              If set, vote allowed only in this time window.
            </div>

            <div className="pc-grid2 pc-grid2-tight">
              <div>
                <div className="pc-mini">Start</div>
                <input
                  className="pc-input"
                  type="datetime-local"
                  value={form.start_at ?? ""}
                  onChange={(e) => setField("start_at", e.target.value || null)}
                />
              </div>

              <div>
                <div className="pc-mini">End</div>
                <input
                  className="pc-input"
                  type="datetime-local"
                  value={form.end_at ?? ""}
                  onChange={(e) => setField("end_at", e.target.value || null)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pc-panel pc-panel-soft">
          <div className="pc-panel-title">Category IDs (optional)</div>
          <div className="pc-panel-sub">
            If you haven't implemented category selection UI yet, you can leave these empty.
          </div>

          <div className="pc-grid3">
            <input
              className="pc-input"
              type="number"
              placeholder="main_category_id"
              value={form.main_category_id ?? ""}
              onChange={(e) => setField("main_category_id", e.target.value ? Number(e.target.value) : null)}
            />
            <input
              className="pc-input"
              type="number"
              placeholder="sub_category_l1_id"
              value={form.sub_category_l1_id ?? ""}
              onChange={(e) => setField("sub_category_l1_id", e.target.value ? Number(e.target.value) : null)}
            />
            <input
              className="pc-input"
              type="number"
              placeholder="sub_category_l2_id"
              value={form.sub_category_l2_id ?? ""}
              onChange={(e) => setField("sub_category_l2_id", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <div className="pc-options-head">
          <div className="pc-options-title">Options</div>
          <button type="button" className="pc-btn pc-btn-primary" onClick={addOption}>
            ➕ Add Option
          </button>
        </div>

        <div className="pc-options">
          {form.options.map((opt, idx) => (
            <div className="pc-opt" key={idx}>
              <div className="pc-opt-top">
                <div className="pc-opt-title">Option #{idx + 1}</div>

                <div className="pc-opt-actions">
                  <button
                    type="button"
                    className="pc-mini-btn"
                    onClick={() => moveOption(idx, idx - 1)}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="pc-mini-btn"
                    onClick={() => moveOption(idx, idx + 1)}
                    disabled={idx === form.options.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="pc-mini-btn pc-mini-btn-danger"
                    onClick={() => removeOption(idx)}
                    disabled={form.options.length <= 2}
                    title="Remove"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="pc-subsection">
                <div className="pc-mini">Label</div>
                <input
                  className="pc-input"
                  value={opt.label}
                  onChange={(e) => setOption(idx, { label: e.target.value })}
                  placeholder="Option text..."
                />
              </div>

              <div className="pc-checkrow">
                <input
                  type="checkbox"
                  checked={opt.hasImage}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setOption(idx, { hasImage: v, img_url: v ? opt.img_url : "" });
                  }}
                />
                <span className="pc-checktext">Include image (optional)</span>
              </div>

              {opt.hasImage && (
                <div className="pc-subsection">
                  <div className="pc-mini">Image URL</div>
                  <input
                    className="pc-input"
                    value={opt.img_url}
                    onChange={(e) => setOption(idx, { img_url: e.target.value })}
                    placeholder="https://... (optional)"
                  />
                  <div className="pc-hint">(ตอนนี้ใช้ URL ก่อน ถ้าจะทำ upload ทีหลังค่อยเปลี่ยน)</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pc-messages">
          {errors.length > 0 && (
            <div className="pc-msg pc-msg-error">
              <div className="pc-msg-title">Submit validation</div>
              <ul className="pc-msg-list">
                {errors.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {draftWarnings.length > 0 && (
            <div className="pc-msg pc-msg-warn">
              <div className="pc-msg-title">Draft warnings</div>
              <ul className="pc-msg-list">
                {draftWarnings.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="pc-actions">
          <button type="button" className="pc-btn pc-btn-outline" onClick={handleSaveDraft} disabled={submitting}>
            💾 Save Draft
          </button>

          <button type="button" className="pc-btn pc-btn-primary" onClick={handleSubmitForReview} disabled={submitting}>
            📤 Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollCreate;
