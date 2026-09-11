import React, { useState } from 'react';
import { CustomFieldDefinition } from '../../types';

interface CustomFieldRendererProps {
  fields: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (fieldCode: string, value: unknown) => void;
  disabled?: boolean;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  fields,
  values,
  onChange,
  disabled = false
}) => {
  const [customModeFields, setCustomModeFields] = useState<Record<string, boolean>>({});

  if (!fields || fields.length === 0) return null;

  const toggleCustomMode = (fieldCode: string) => {
    setCustomModeFields(prev => ({
      ...prev,
      [fieldCode]: !prev[fieldCode]
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(field => {
        const val = values[field.code] ?? field.default_value ?? '';
        const isCustomMode = Boolean(customModeFields[field.code]) || 
          (val !== '' && field.options && !field.options.includes(String(val)));

        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                {field.name}
                {field.is_required && <span className="text-rose-500 ml-1">*</span>}
              </label>
              {field.field_type === 'select' && (
                <button
                  type="button"
                  onClick={() => toggleCustomMode(field.code)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  {isCustomMode ? 'তালিকা থেকে বাছাই' : '+ কাস্টম লিখুন'}
                </button>
              )}
            </div>

            {field.field_type === 'select' && (
              isCustomMode ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={String(val)}
                    disabled={disabled}
                    placeholder={`যেমন: ${field.options?.[0] || 'কাস্টম মান লিখুন'}`}
                    onChange={e => onChange(field.code, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-indigo-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      toggleCustomMode(field.code);
                      if (field.options?.[0]) onChange(field.code, field.options[0]);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                    title="তালিকা থেকে নির্বাচন করুন"
                  >
                    তালিকা
                  </button>
                </div>
              ) : (
                <select
                  value={String(val)}
                  disabled={disabled}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      toggleCustomMode(field.code);
                      onChange(field.code, '');
                    } else {
                      onChange(field.code, e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">-- Select {field.name} --</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="__custom__">➕ কাস্টম / নিজের মতো লিখুন...</option>
                </select>
              )
            )}

            {field.field_type === 'boolean' && (
              <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  disabled={disabled}
                  onChange={e => onChange(field.code, e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">Enabled / Yes</span>
              </label>
            )}

            {['text', 'phone', 'email'].includes(field.field_type) && (
              <input
                type={field.field_type === 'phone' ? 'tel' : field.field_type}
                value={String(val)}
                placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                disabled={disabled}
                onChange={e => onChange(field.code, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
              />
            )}

            {['number', 'decimal'].includes(field.field_type) && (
              <input
                type="number"
                step={field.field_type === 'decimal' ? '0.01' : '1'}
                value={val === '' ? '' : Number(val)}
                placeholder={field.placeholder || '0'}
                disabled={disabled}
                onChange={e => onChange(field.code, e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
              />
            )}

            {['date', 'datetime'].includes(field.field_type) && (
              <input
                type={field.field_type === 'date' ? 'date' : 'datetime-local'}
                value={String(val)}
                disabled={disabled}
                onChange={e => onChange(field.code, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"
              />
            )}

            {field.help_text && (
              <p className="text-[11px] text-slate-400">{field.help_text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};
