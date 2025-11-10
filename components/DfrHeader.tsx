import React, { useRef, useLayoutEffect, useEffect } from 'react';
import type { DfrHeaderData } from '../types';

interface HeaderProps {
    data: DfrHeaderData;
    onDataChange: (field: keyof DfrHeaderData, value: string) => void;
    isPrintable?: boolean;
    errors?: Set<keyof DfrHeaderData>;
    placeholders?: Partial<DfrHeaderData>;
}

const XterraLogo: React.FC<{ isPrintable?: boolean }> = ({ isPrintable = false }) => (
    <div className="flex items-center">
        <img
            src="https://ik.imagekit.io/fzpijprte/XTerraLogo2019_Horizontal.jpg?updatedAt=1758827714962"
            alt="X-TERRA Logo"
            className={isPrintable ? "h-10 w-auto" : "h-14 w-auto"}
        />
    </div>
);

const SelectableLabelField: React.FC<{ 
    labelType: string; 
    value: string; 
    onLabelChange: (value: string) => void; 
    onValueChange: (value: string) => void;
    isPrintable?: boolean;
    isInvalid?: boolean;
    placeholder?: string;
}> = ({ labelType, value, onLabelChange, onValueChange, isPrintable = false, isInvalid = false, placeholder = '' }) => {
    
    const options = ["IOCG Lease #", "Disposition #", "ENV File #", "License #"];

    if (isPrintable) {
        return (
            <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{labelType}:</span>
                <span className="text-base font-normal text-black break-words">{value || '\u00A0'}</span>
            </div>
        );
    }
    
    const selectClasses = `p-1 border-b-2 focus:outline-none focus:border-[#007D8C] transition duration-200 bg-transparent text-base font-bold text-black ${isInvalid ? 'border-red-500' : 'border-gray-300'}`;
    const inputClasses = `p-1 w-full border-b-2 focus:outline-none focus:border-[#007D8C] transition duration-200 bg-transparent text-base font-normal text-black min-w-0 ${isInvalid ? 'border-red-500' : 'border-gray-300'}`;

    return (
        <div className="flex items-baseline gap-2">
             <select value={labelType} onChange={(e) => onLabelChange(e.target.value)} className={selectClasses}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input 
                type="text" 
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className={inputClasses}
                placeholder={placeholder}
                spellCheck={true}
            />
        </div>
    );
};

const EditableField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    isPrintable?: boolean; 
    type?: 'text' | 'date'; 
    isInvalid?: boolean; 
    isTextArea?: boolean; 
    placeholder?: string; 
}> = ({ label, value, onChange, isPrintable = false, type = 'text', isInvalid = false, isTextArea = false, placeholder = '' }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);
    
    if (isPrintable) {
        return (
            <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</span>
                <span className="text-base font-normal text-black break-words">{value || '\u00A0'}</span>
            </div>
        );
    }

    // --- FIXED INDEPENDENT DATE DROPDOWNS ---
if (type === 'date') {
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (dateValue) {
            const dateObj = new Date(dateValue);
            const formatted = dateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
            onChange(formatted);
        } else {
            onChange('');
        }
    };

    const commonInputClasses = `p-1 w-full border-b-2 focus:outline-none focus:border-[#007D8C]
        transition duration-200 bg-transparent text-base font-normal text-black min-w-0
        ${isInvalid ? 'border-red-500' : 'border-gray-300'}`;

    return (
        <div className="flex items-baseline gap-2">
            <label className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap">
                {label}:
            </label>
            <input
                type="date"
                value={
                    value
                        ? (() => {
                              const parsed = new Date(value);
                              if (isNaN(parsed.getTime())) return '';
                              return parsed.toISOString().split('T')[0];
                          })()
                        : ''
                }
                onChange={handleDateChange}
                className={commonInputClasses}
            />
        </div>
    );
}



    const commonInputClasses = `p-1 w-full border-b-2 focus:outline-none focus:border-[#007D8C] transition duration-200 bg-transparent text-base font-normal text-black min-w-0 ${isInvalid ? 'border-red-500' : 'border-gray-300'}`;
    
    if (isTextArea) {
        return (
            <div className="flex items-start gap-2">
                <label className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap pt-1">{label}:</label>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={1}
                    className={`${commonInputClasses} resize-none overflow-hidden`}
                    placeholder={placeholder}
                    spellCheck={true}
                />
            </div>
        );
    }

    return (
        <div className="flex items-baseline gap-2">
            <label className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</label>
            <input 
                ref={inputRef}
                type="text" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={commonInputClasses}
                placeholder={placeholder}
                spellCheck={true}
            />
        </div>
    );
};

export const DfrHeader: React.FC<HeaderProps> = ({ data, onDataChange, isPrintable = false, errors, placeholders = {} }) => {
    return (
        <div className={`bg-white ${isPrintable ? 'p-0 shadow-none' : 'p-6 shadow-md rounded-lg'}`}>
            <div className={`grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] md:items-center pb-4 gap-4`}>
                <div className="flex justify-center md:justify-start">
                    <XterraLogo isPrintable={isPrintable} />
                </div>
                <h1 className={`font-extrabold text-[#007D8C] tracking-wider text-center whitespace-nowrap ${isPrintable ? 'text-2xl' : 'text-4xl'}`}>
                    DAILY FIELD REPORT
                </h1>
                <div></div>
            </div>
            
            <div className="border-t-4 border-[#007D8C]"></div>
            
            <div className={`bg-white ${isPrintable ? 'py-2' : 'pt-4'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex flex-col gap-y-2">
                        <EditableField label="DATE" value={data.date} onChange={(v) => onDataChange('date', v)} isPrintable={isPrintable} isInvalid={errors?.has('date')} type="date" />
                        <EditableField label="PROPONENT" value={data.proponent} onChange={(v) => onDataChange('proponent', v)} isPrintable={isPrintable} isInvalid={errors?.has('proponent')} placeholder={placeholders.proponent} />
                        <EditableField label="LOCATION" value={data.location} onChange={(v) => onDataChange('location', v)} isPrintable={isPrintable} isInvalid={errors?.has('location')} isTextArea placeholder={placeholders.location}/>
                    </div>

                    <div className="flex flex-col gap-y-2">
                        <EditableField label="X-TES PROJECT #" value={data.projectNumber} onChange={(v) => onDataChange('projectNumber', v)} isPrintable={isPrintable} isInvalid={errors?.has('projectNumber')} placeholder={placeholders.projectNumber} />
                        <EditableField label="MONITOR" value={data.monitor} onChange={(v) => onDataChange('monitor', v)} isPrintable={isPrintable} isInvalid={errors?.has('monitor')} placeholder={placeholders.monitor} />
                        <SelectableLabelField
                            labelType={data.envFileType}
                            value={data.envFileValue}
                            onLabelChange={(v) => onDataChange('envFileType', v)}
                            onValueChange={(v) => onDataChange('envFileValue', v)}
                            isPrintable={isPrintable}
                            isInvalid={errors?.has('envFileValue')}
                            placeholder={placeholders.envFileValue}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <EditableField label="PROJECT NAME" value={data.projectName} onChange={(v) => onDataChange('projectName', v)} isPrintable={isPrintable} isInvalid={errors?.has('projectName')} isTextArea placeholder={placeholders.projectName} />
                    </div>
                </div>
            </div>
            
            <div className={`border-t-4 border-[#007D8C] ${isPrintable ? '' : 'mt-2'}`}></div>
        </div>
    );
};
