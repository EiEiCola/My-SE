import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "./PollCreate.css"; // ✅ ให้ไฟล์นี้เป็น CSS ใหม่ (pcx-*)
import { type Poll, pollAPI, categoryAPI } from "../../../../services/http/poll";

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
  is_anonymous: boolean;
  options: OptionForm[];
};

type CatItem = { id: number; title: string };

const emptyForm: PollForm = {
  question: "",
  allow_multiple: false,
  max_choice: null,
  start_at: null,
  end_at: null,

  main_category_id: null,
  sub_category_l1_id: null,
  sub_category_l2_id: null,
  is_anonymous: false,

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

// ✅ helper เหมือนเดิม
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const toFullUrl = (u?: string) => {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
};

const PollCreate: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const pollId = Number(params.id || 0);
  const isEdit = !!pollId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pollStatusID, setPollStatusID] = useState<number | null>(null);
  const [form, setForm] = useState<PollForm>(emptyForm);

  // ✅ categories state
  const [mainCats, setMainCats] = useState<CatItem[]>([]);
  const [sub1Cats, setSub1Cats] = useState<CatItem[]>([]);
  const [sub2Cats, setSub2Cats] = useState<CatItem[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  
  const [catNames, setCatNames] = useState<{ main?: string; sub1?: string; sub2?: string }>({});


  const optionCount = form.options.length;

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
      
      is_anonymous: form.is_anonymous, // ✅ เพิ่มตรงนี้
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
      const res = await (pollAPI as any).createDraft(payload);
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

    if (!form.main_category_id) {
    alert("Please select Main Category before submit");
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

  // ✅ Load categories (Main)
  useEffect(() => {
    const loadMain = async () => {
      setCatLoading(true);
      try {
        const mains = await (categoryAPI as any).listMain();
        setMainCats(mains ?? []);
      } catch (e) {
        console.error(e);
        setMainCats([]);
      } finally {
        setCatLoading(false);
      }
    };
    loadMain();
  }, []);

  // ✅ When main changes -> load sub1
  useEffect(() => {
    const loadSub1 = async () => {
      setSub1Cats([]);
      setSub2Cats([]);

      if (!form.main_category_id) return;

      try {
        const sub1 = await (categoryAPI as any).listSub1(form.main_category_id);
        setSub1Cats(sub1 ?? []);
      } catch (e) {
        console.error(e);
        setSub1Cats([]);
      }
    };
    loadSub1();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.main_category_id]);

  // ✅ When sub1 changes -> load sub2
  useEffect(() => {
    const loadSub2 = async () => {
      setSub2Cats([]);
      if (!form.sub_category_l1_id) return;

      try {
        const sub2 = await (categoryAPI as any).listSub2(form.sub_category_l1_id);
        setSub2Cats(sub2 ?? []);
      } catch (e) {
        console.error(e);
        setSub2Cats([]);
      }
    };
    loadSub2();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sub_category_l1_id]);

  // ✅ Edit mode: load poll first (ไม่กระทบ logic เดิม)
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
        const is_anonymous = !!(data?.is_anonymous ?? false);
        const rawOptions = (data?.options ?? data?.poll_options ?? data?.PollOptions ?? []) as any[];

        const opts = rawOptions.map((o: any) => {
          const img = o?.img_url ?? o?.ImgURL ?? o?.image_url ?? o?.imageUrl ?? "";
          const label =
            o?.label ??
            o?.text ??
            o?.title ??
            o?.option_text ??
            o?.optionText ??
            o?.OptionText ??
            "";

          return {
            label: String(label ?? ""),
            hasImage: !!String(img ?? "").trim(),
            img_url: String(img ?? ""),
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
          is_anonymous, // ✅ เพิ่มตรงนี้
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

  if (loading) return <div className="pcx-page">Loading...</div>;

  return (
    <div className="pcx-page">
      <div className="pcx-card">
        {/* Header */}
        <div className="pcx-header">
          <div className="pcx-headerLeft">
            <div className="pcx-badge">{isEdit ? "EDIT POLL" : "CREATE POLL"}</div>
            <div className="pcx-title">{isEdit ? "Edit Poll" : "Create Poll"}</div>
            <div className="pcx-subtitle">Save Draft → Submit for Admin Review → (Approve) → Published</div>
            {isEdit && pollStatusID !== null && (
              <div className="pcx-status">
                Current Status: <span>{pollStatusID}</span>
              </div>
            )}
          </div>

          <button type="button" className="pcx-btn pcx-btnGhost" onClick={() => navigate("/User/Polls/my")}>
            ← Back
          </button>
        </div>

        {/* Question */}
        <div className="pcx-section pcx-sectionTop">
          <div className="pcx-sectionHead">
            <div className="pcx-sectionTitle">Question</div>
            <div className="pcx-sectionHint">ใส่คำถามสั้น ๆ ให้คนตอบเข้าใจง่าย</div>
          </div>
          <input
            className="pcx-input pcx-inputLg"
            value={form.question}
            onChange={(e) => setField("question", e.target.value)}
            placeholder="เช่น อยากให้โรงอาหารเพิ่มเมนูอะไร?"
          />
        </div>

        <label className="pcx-check">
  <input
    type="checkbox"
    checked={form.is_anonymous}
    onChange={(e) => setField("is_anonymous", e.target.checked)}
  />
  ไม่เปิดเผยชื่อ (แสดงเป็น “ไม่เปิดเผยชื่อ”)
</label>


        <div className="pcx-row pcx-rowBetween" style={{ marginTop: 10 }}>
  <div>
    <div className="pcx-sectionTitle" style={{ fontSize: 14 }}>โพสต์แบบไม่เปิดเผยชื่อ</div>
    <div className="pcx-sectionHint">ถ้าเปิด คนอื่นจะเห็นชื่อเป็น “ไม่ระบุตัวตน”</div>
  </div>

  <label className="pcx-switch">
    <input
      type="checkbox"
      checked={form.is_anonymous}
      onChange={(e) => setField("is_anonymous", e.target.checked)}
    />
    <span className="pcx-slider" />
    <span className="pcx-check">{form.is_anonymous ? "เปิด" : "ปิด"}</span>
  </label>
</div>


        {/* Panels row */}
        <div className="pcx-grid2">
          {/* Multiple choice */}
          <div className="pcx-panel">
            <div className="pcx-panelHead">
              <div className="pcx-panelTitle">Allow multiple choices</div>
              <div className="pcx-pill">{form.allow_multiple ? "MULTI" : "SINGLE"}</div>
            </div>
            <div className="pcx-panelSub">เปิดแล้วผู้โหวตเลือกได้มากกว่า 1 ตัวเลือก</div>

            <div className="pcx-row pcx-rowBetween">
              <label className="pcx-switch">
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
                <span className="pcx-slider" />
                <span className="pcx-check">{form.allow_multiple ? "Enabled" : "Disabled"}</span>
              </label>

              {form.allow_multiple && (
                <span className="pcx-miniPill">Max ≤ {form.options.length}</span>
              )}
            </div>

            {form.allow_multiple && (
              <div className="pcx-subsection">
                <div className="pcx-label">Max choice</div>
                <input
                  className="pcx-input"
                  type="number"
                  min={2}
                  max={form.options.length}
                  value={form.max_choice ?? ""}
                  onChange={(e) => setField("max_choice", e.target.value ? Number(e.target.value) : null)}
                  placeholder="2"
                />
                <div className="pcx-help">กำหนดจำนวนสูงสุดที่เลือกได้</div>
              </div>
            )}
          </div>

          {/* Time range */}
          <div className="pcx-panel">
            <div className="pcx-panelHead">
              <div className="pcx-panelTitle">Time range (optional)</div>
              <div className="pcx-pill">SCHEDULE</div>
            </div>
            <div className="pcx-panelSub">ถ้าตั้งเวลา ระบบจะให้โหวตได้เฉพาะช่วงนั้น</div>

            <div className="pcx-grid2tight">
              <div>
                <div className="pcx-label">Start</div>
                <input
                  className="pcx-input"
                  type="datetime-local"
                  value={form.start_at ?? ""}
                  onChange={(e) => setField("start_at", e.target.value || null)}
                />
              </div>

              <div>
                <div className="pcx-label">End</div>
                <input
                  className="pcx-input"
                  type="datetime-local"
                  value={form.end_at ?? ""}
                  onChange={(e) => setField("end_at", e.target.value || null)}
                />
              </div>
            </div>

            <div className="pcx-row">
              <div className="pcx-kv">
                <div className="pcx-k">Start</div>
                <div className="pcx-v">{form.start_at ? dayjs(form.start_at).format("DD MMM YYYY HH:mm") : "-"}</div>
              </div>
              <div className="pcx-kv">
                <div className="pcx-k">End</div>
                <div className="pcx-v">{form.end_at ? dayjs(form.end_at).format("DD MMM YYYY HH:mm") : "-"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <details className="pcx-details" open>
          <summary className="pcx-summary">
            <div>
              <div className="pcx-summaryTitle">Categories (optional)</div>
              <div className="pcx-summaryHint">เลือกหมวดหมู่เพื่อให้คนหาโพลเจอง่ายขึ้น</div>
            </div>
            <span className="pcx-miniPill">{catLoading ? "Loading..." : "Ready"}</span>
          </summary>

          <div className="pcx-panel pcx-panelSoft" style={{ borderRadius: 0, border: "none" }}>
            <div className="pcx-grid3">
              <div>
                <div className="pcx-label">Main</div>
                <select
                  className="pcx-input"
                  value={form.main_category_id ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    setField("main_category_id", v);
                    // reset children
                    setField("sub_category_l1_id", null);
                    setField("sub_category_l2_id", null);
                  }}
                >
                  <option value="">— เลือก Main —</option>
                  {mainCats.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="pcx-label">Sub 1</div>
                <select
                  className="pcx-input"
                  value={form.sub_category_l1_id ?? ""}
                  disabled={!form.main_category_id}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    setField("sub_category_l1_id", v);
                    setField("sub_category_l2_id", null);
                  }}
                >
                  <option value="">{form.main_category_id ? "— เลือก Sub 1 —" : "เลือก Main ก่อน"}</option>
                  {sub1Cats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="pcx-label">Sub 2</div>
                <select
                  className="pcx-input"
                  value={form.sub_category_l2_id ?? ""}
                  disabled={!form.sub_category_l1_id}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    setField("sub_category_l2_id", v);
                  }}
                >
                  <option value="">{form.sub_category_l1_id ? "— เลือก Sub 2 —" : "เลือก Sub 1 ก่อน"}</option>
                  {sub2Cats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pcx-mono">
              Selected IDs:{" "}
              <span>
                main={form.main_category_id ?? "-"} sub1={form.sub_category_l1_id ?? "-"} sub2={form.sub_category_l2_id ?? "-"}
              </span>
            </div>
          </div>
        </details>

        {/* Options header */}
        <div className="pcx-section">
          <div className="pcx-sectionHead pcx-sectionHeadRow">
            <div>
              <div className="pcx-sectionTitle">Options</div>
              <div className="pcx-sectionHint">อย่างน้อย 2 ตัวเลือก • ลากจัดลำดับด้วยปุ่ม ↑ ↓</div>
            </div>

            <button type="button" className="pcx-btn pcx-btnPrimary" onClick={addOption}>
              ➕ Add Option
            </button>
          </div>

          <div className="pcx-optionsGrid">
            {form.options.map((opt, idx) => (
              <div className="pcx-optCard" key={idx}>
                <div className="pcx-optHead">
                  <div className="pcx-optTitle">Option #{idx + 1}</div>

                  <div className="pcx-optActions">
                    <button
                      type="button"
                      className="pcx-iconBtn"
                      onClick={() => moveOption(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="pcx-iconBtn"
                      onClick={() => moveOption(idx, idx + 1)}
                      disabled={idx === form.options.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="pcx-iconBtn pcx-iconDanger"
                      onClick={() => removeOption(idx)}
                      disabled={form.options.length <= 2}
                      title="Remove"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div className="pcx-subsection">
                  <div className="pcx-label">Label</div>
                  <input
                    className="pcx-input"
                    value={opt.label}
                    onChange={(e) => setOption(idx, { label: e.target.value })}
                    placeholder="เช่น โหวตตัวเลือกนี้..."
                  />
                </div>

                <div className="pcx-subsection">
                  <label className="pcx-check">
                    <input
                      type="checkbox"
                      checked={opt.hasImage}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setOption(idx, { hasImage: v, img_url: v ? opt.img_url : "" });
                      }}
                    />
                    Include image (optional)
                  </label>

                  {opt.hasImage && (
                    <div className="pcx-uploadBox">
                      <div className="pcx-uploadRow">
                        <input
                          className="pcx-file"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            try {
                              const res = await (pollAPI as any).uploadOptionImage(file);
                              const url = (res as any)?.data?.url ?? (res as any)?.data?.data?.url ?? "";
                              if (!url) throw new Error("upload url missing");
                              setOption(idx, { img_url: url, hasImage: true });
                            } catch (err) {
                              console.error(err);
                              alert("Upload image failed");
                              setOption(idx, { img_url: "" });
                            } finally {
                              e.currentTarget.value = "";
                            }
                          }}
                        />

                        {opt.img_url ? (
                          <div className="pcx-previewRow">
                            <img className="pcx-previewImg" src={toFullUrl(opt.img_url)} alt={`option-${idx + 1}`} />
                            <button type="button" className="pcx-btn pcx-btnGhost" onClick={() => setOption(idx, { img_url: "" })}>
                              ลบรูป
                            </button>
                          </div>
                        ) : (
                          <div className="pcx-help">เลือกรูปเพื่ออัปโหลด (ระบบจะเก็บ url ให้อัตโนมัติ)</div>
                        )}

                        {opt.img_url && (
                          <div className="pcx-mono">
                            Saved URL: <span>{opt.img_url}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="pcx-messages">
          {errors.length > 0 && (
            <div className="pcx-alert pcx-alertError">
              <div className="pcx-alertTitle">Submit validation</div>
              <ul className="pcx-alertList">
                {errors.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {draftWarnings.length > 0 && (
            <div className="pcx-alert pcx-alertWarn">
              <div className="pcx-alertTitle">Draft warnings</div>
              <ul className="pcx-alertList">
                {draftWarnings.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pcx-actions">
          <button type="button" className="pcx-btn pcx-btnGhost" onClick={handleSaveDraft} disabled={submitting}>
            💾 Save Draft
          </button>

          <button type="button" className="pcx-btn pcx-btnPrimary" onClick={handleSubmitForReview} disabled={submitting}>
            📤 Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollCreate;
