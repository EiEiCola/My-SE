import React, { useEffect, useMemo, useRef, useState } from "react";
import "./PollList.css";

export type CategoryOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: CategoryOption[];
};

export const PollCategoryDropdown: React.FC<Props> = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const currentLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found ? found.label : "หมวดหมู่ทั้งหมด";
  }, [options, value]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return options;
    return options.filter((o) => o.label.toLowerCase().includes(k));
  }, [options, q]);

  return (
    <div className="dd" ref={ref}>
      <button className="dd-btn" type="button" onClick={() => setOpen((v) => !v)}>
        <span className="dd-label">{currentLabel}</span>
        <span className="dd-caret">▾</span>
      </button>

      {open ? (
        <div className="dd-menu">
          <div className="dd-search">
            <span className="dd-search-ico">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาหมวด..." />
          </div>

          <div className="dd-list">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className={o.value === value ? "dd-item dd-item-active" : "dd-item"}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQ("");
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
