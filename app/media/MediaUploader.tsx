"use client";

import { useState, useTransition } from "react";
import { uploadMedia } from "./actions";

interface Props {
  seniorId: string;
  uploadedById: string;
}

export default function MediaUploader({ seniorId, uploadedById }: Props) {
  const [caption, setCaption] = useState("");
  const [peopleNames, setPeopleNames] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [activity, setActivity] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setSuccess(false);
    setError("");
  }

  function handleSubmit() {
    if (!file) {
      setError("请先选择一张照片");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("caption", caption);
    formData.set("peopleNames", peopleNames);
    formData.set("year", year);
    formData.set("location", location);
    formData.set("activity", activity);
    formData.set("seniorId", seniorId);
    formData.set("uploadedById", uploadedById);

    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setFile(null);
        setPreview(null);
        setCaption("");
        setPeopleNames("");
        setYear("");
        setLocation("");
        setActivity("");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">上传新照片</h2>

      {/* File input */}
      <label className="block border-2 border-dashed border-amber-300 rounded-xl p-6 text-center cursor-pointer hover:bg-amber-50 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="预览"
            className="max-h-48 mx-auto rounded-lg object-contain"
          />
        ) : (
          <div>
            <p className="text-4xl mb-2">📷</p>
            <p className="text-gray-500 text-lg">点击选择照片</p>
          </div>
        )}
      </label>

      {/* Caption */}
      <Field label="照片说明" value={caption} onChange={setCaption} placeholder="例如：全家福" />

      {/* People names */}
      <div>
        <label className="block text-gray-700 font-semibold mb-1">
          照片中的人物
        </label>
        <input
          type="text"
          value={peopleNames}
          onChange={(e) => setPeopleNames(e.target.value)}
          placeholder="例如：妈妈，爸爸，大姐"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-amber-400"
        />
        <p className="text-gray-400 text-sm mt-1">多个人用逗号分隔</p>
      </div>

      {/* Year */}
      <Field label="拍摄年份" value={year} onChange={setYear} placeholder="例如：1985" />

      {/* Location */}
      <Field label="拍摄地点" value={location} onChange={setLocation} placeholder="例如：北京，外婆家" />

      {/* Activity */}
      <Field label="当时在做什么" value={activity} onChange={setActivity} placeholder="例如：过春节，家庭聚餐" />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700">
          ✅ 照片上传成功！
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || !file}
        className="w-full bg-amber-500 text-white rounded-xl py-3 text-xl font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        {isPending ? "上传中..." : "上传照片"}
      </button>
    </div>
  );
}

function Field({
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
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-amber-400"
      />
    </div>
  );
}
