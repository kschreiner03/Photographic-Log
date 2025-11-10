import React, { useRef, useLayoutEffect, useEffect } from 'react';
import type { HeaderData } from '../types';

interface HeaderProps {
    data: HeaderData;
    onDataChange: (field: keyof HeaderData, value: string) => void;
    isPrintable?: boolean;
    errors?: Set<keyof HeaderData>;
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

const InfoBlock: React.FC<{ lines: string[]; isPrintable?: boolean }> = ({ lines, isPrintable = false }) => (
    <div className={isPrintable ? "text-xs text-black" : "text-sm text-black"}>
        {lines.map((line, index) => <p key={index}>{line}</p>)}
    </div>
);

const EditableField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    isPrintable?: boolean; 
    type?: 'text' | 'date'; 
    isInvalid?: boolean; 
    isTextArea?: boolean; 
}> = ({ label, value, onChange, isPrintable = false, type = 'text', isInvalid = false, isTextArea = false }) => {
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

    const commonInputClasses = `p-1 w-full border-b-2 focus:outline-none focus:border-[#007D8C]
        transition duration-200 bg-transparent text-base font-normal text-black min-w-0
        ${isInvalid ? 'border-red-500' : 'border-gray-300'}`;
    
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
            />
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ data, onDataChange, isPrintable = false, errors }) => {
    return (
        <div className={`bg-white ${isPrintable ? 'p-0 shadow-none mb-2' : 'p-6 shadow-md rounded-lg mb-4'}`}>
            <div className={`grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] md:items-center pb-4 gap-4`}>
                <div className="flex justify-center md:justify-start">
                    <XterraLogo isPrintable={isPrintable} />
                </div>
                <h1 className={`font-extrabold text-[#007D8C] tracking-wider text-center whitespace-nowrap ${isPrintable ? 'text-2xl' : 'text-4xl'}`}>
                    PHOTOGRAPHIC LOG
                </h1>
                <div></div>
            </div>
            
            <div className={`border-t-4 border-[#007D8C]`}></div>

            <div className={`max-w-5xl mx-auto flex flex-col ${isPrintable ? 'gap-y-1 pt-3 pb-2' : 'gap-y-2 pt-3 pb-2'}`}>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isPrintable ? 'gap-x-4 gap-y-1' : 'gap-x-8 gap-y-2'}`}>
                    {/* Left column */}
                    <div className={`flex flex-col ${isPrintable ? 'gap-1' : 'gap-2'}`}>
                        <EditableField label="Proponent" value={data.proponent} onChange={(value) => onDataChange('proponent', value)} isPrintable={isPrintable} isInvalid={errors?.has('proponent')}/>
                        <EditableField label="Location" value={data.location} onChange={(value) => onDataChange('location', value)} isPrintable={isPrintable} isInvalid={errors?.has('location')} isTextArea/>
                    </div>
                    {/* Right column */}
                    <div className={`flex flex-col ${isPrintable ? 'gap-1' : 'gap-2'}`}>
                        <EditableField label="Date" value={data.date} onChange={(value) => onDataChange('date', value)} isPrintable={isPrintable} type="date" isInvalid={errors?.has('date')}/>
                        <EditableField label="Project" value={data.projectNumber} onChange={(value) => onDataChange('projectNumber', value)} isPrintable={isPrintable} isInvalid={errors?.has('projectNumber')}/>
                    </div>
                </div>
                {/* Full-width project name field */}
                <div className="flex flex-col">
                    <EditableField label="Project Name" value={data.projectName} onChange={(value) => onDataChange('projectName', value)} isPrintable={isPrintable} isInvalid={errors?.has('projectName')} isTextArea/>
                </div>
            </div>
             <div className={`border-t-4 border-[#007D8C]`}></div>
        </div>
    );
};

export default Header;