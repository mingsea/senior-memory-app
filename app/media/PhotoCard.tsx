"use client";

import { useState, useTransition } from "react";
import { updateMediaItem, deleteMediaItem } from "./actions";

interface MediaItem {
  id: string;
  url: string;
  caption: string | null;
  peopleNames: string | null;
  year: string | null;
  location: string | null;
  activity: string | null;
}

export default function PhotoCard({ item }: { item: MediaItem }) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(item.caption || "");
  const [peopleNames, setPeopleNames] = useState(item.peopleNames || "");
  const [year, setYear] = useState(item.year || "");
  const [location, setLocation] = useState(item.location || "");
  const [activity, setActivity] = useState(item.activity || "");
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateMediaItem(item.id, { caption, peopleNames, year, location, activity });
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMediaItem(item.id);
    });
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="border-2 border-amber-300 rounded-xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="照片" className="w-full h-48 object-cover" />
        <div className="p-4 space-y-3">
          <EditField label="照片说明" value={caption} onChange={setCaption} placeholder="例如：全家福" />
          <EditField label="照片中的人物（逗号分隔）" value={peopleNames} onChange={setPeopleNames} placeholder="例如：妈妈，爸爸" />
          <EditField label="拍摄年份" value={year} onChange={setYear} placeholder="例如：1985" />
          <EditField label="拍摄地点" value={location} onChange={setLocation} placeholder="例如：北京，外婆家" />
          <EditField label="当时在做什么" value={activity} onChange={setActivity} placeholder="例如：过春节，家庭聚餐" />
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2 border-2 border-gray-200 rounded-xl text-gray-500 text-lg"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-2 flex-grow py-2 bg-amber-500 text-white rounded-xl text-lg font-semibold disabled:opacity-50"
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.caption || "家人照片"}
          className="w-32 h-32 object-cover flex-shrink-0"
        />
        <div className="flex-1 p-3 min-w-0">
          <p className="font-bold text-gray-800 text-lg truncate">
            {item.caption || <span className="text-gray-400 font-normal">无说明</span>}
          </p>
          {item.peopleNames && (
            <p className="text-gray-600 text-sm mt-1">👤 {item.peopleNames}</p>
          )}
          {item.year && (
            <p className="text-gray-600 text-sm">📅 {item.year}年</p>
          )}
          {item.location && (
            <p className="text-gray-600 text-sm">📍 {item.location}</p>
          )}
          {item.activity && (
            <p className="text-gray-600 text-sm">🎯 {item.activity}</p>
          )}
          {!item.peopleNames && !item.year && !item.location && !item.activity && (
            <p className="text-gray-400 text-sm mt-1 italic">暂无标注信息</p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-200"
            >
              编辑
            </button>
            {confirmDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-1 bg-red-500 text-white rounded-lg text-sm font-semibold"
                >
                  确认删除
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-1 bg-gray-100 text-gray-500 rounded-lg text-sm"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-1 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-red-50 hover:text-red-500"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-gray-600 text-sm font-semibold mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-amber-400"
      />
    </div>
  );
}
