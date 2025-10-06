import React, { useRef, useLayoutEffect } from 'react';
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

const EditableField: React.FC<{ label: string; value: string; onChange: (value: string) => void; isPrintable?: boolean; type?: 'text' | 'date'; isInvalid?: boolean; isTextArea?: boolean; }> = ({ label, value, onChange, isPrintable = false, type = 'text', isInvalid = false, isTextArea = false }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            // By setting the height to 'inherit', we ensure it shrinks when text is deleted.
            textareaRef.current.style.height = 'inherit';
            // Then we set the height to the scroll height, which represents the full content height.
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
    
    if (type === 'date') {
        const [month, day, year] = React.useMemo(() => {
            if (!value || typeof value !== 'string') return ['', '', ''];
            const cleanedValue = value.replace(',', '');
            const parts = cleanedValue.split(' ').filter(Boolean);
            return [parts[0] || '', parts[1] || '', parts[2] || ''];
        }, [value]);

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
        const years = Array.from({ length: 21 }, (_, i) => String(2020 + i));

        const handleDateChange = (part: 'month' | 'day' | 'year', newValue: string) => {
            const newDate = { month, day, year };
            newDate[part] = newValue;
            // Only update if all parts are selected
            if (part === 'month') newDate.month = newValue;
            if (part === 'day') newDate.day = newValue;
            if (part === 'year') newDate.year = newValue;

            if (newDate.month && newDate.day && newDate.year) {
                onChange(`${newDate.month} ${newDate.day}, ${newDate.year}`);
            } else {
                 onChange([newDate.month, newDate.day, newDate.year].filter(Boolean).join(' '));
            }
        };
        
        const selectClasses = `p-1 w-full border-b-2 focus:outline-none focus:border-[#007D8C] transition duration-200 bg-transparent text-base font-normal text-black ${isInvalid ? 'border-red-500' : 'border-gray-300'}`;

        return (
            <div className="flex items-baseline gap-2">
                <label className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</label>
                <div className="flex gap-2 w-full">
                    <select value={month} onChange={(e) => handleDateChange('month', e.target.value)} className={selectClasses}>
                        <option value="" disabled>Month</option>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={day} onChange={(e) => handleDateChange('day', e.target.value)} className={selectClasses}>
                        <option value="" disabled>Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={year} onChange={(e) => handleDateChange('year', e.target.value)} className={selectClasses}>
                        <option value="" disabled>Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
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
                />
            </div>
        );
    }

    return (
        <div className="flex items-baseline gap-2">
            <label className="text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</label>
            <input 
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
        <div className={`bg-white ${isPrintable ? 'p-0 shadow-none mb-2' : 'p-6 shadow-md rounded-lg mb-8'}`}>
            <div className={`grid grid-cols-1 md:grid-cols-[auto,1fr,auto] md:items-center pb-4 gap-4`}>
                <div className="flex justify-center md:justify-start">
                    <XterraLogo isPrintable={isPrintable} />
                </div>
                <h1 className={`font-extrabold text-[#007D8C] tracking-wider text-center whitespace-nowrap ${isPrintable ? 'text-2xl' : 'text-4xl'}`}>
                    PHOTOGRAPHIC LOG
                </h1>
                <div className={`flex justify-center md:justify-end text-right ${isPrintable ? 'flex-nowrap gap-x-4' : 'flex-wrap gap-x-6 gap-y-2'}`}>
                     <InfoBlock lines={["100-303 Wheeler Pl.", "Saskatoon, SK", "S7P 0A4", "TEL (306) 373-1110", "FAX (306) 373-2444"]} isPrintable={isPrintable} />
                    <InfoBlock lines={["6208 48th Street", "Lloydminster, AB", "T9V 2G1", "TEL (780) 875-1442", "FAX (780) 871-0925"]} isPrintable={isPrintable} />
                </div>
            </div>
            
            <div className={`border-t-4 border-[#007D8C] ${isPrintable ? 'mb-2' : 'mb-4'}`}></div>

            <div className={`max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 ${isPrintable ? 'gap-x-4 gap-y-1' : 'gap-x-8 gap-y-4'}`}>
                <div className={`md:col-span-2 flex flex-col ${isPrintable ? 'gap-1' : 'gap-4'}`}>
                    <EditableField label="Proponent" value={data.proponent} onChange={(value) => onDataChange('proponent', value)} isPrintable={isPrintable} isInvalid={errors?.has('proponent')}/>
                    <EditableField label="Project Name" value={data.projectName} onChange={(value) => onDataChange('projectName', value)} isPrintable={isPrintable} isInvalid={errors?.has('projectName')} isTextArea/>
                    <EditableField label="Location" value={data.location} onChange={(value) => onDataChange('location', value)} isPrintable={isPrintable} isInvalid={errors?.has('location')} isTextArea/>
                </div>
                <div className={`flex flex-col ${isPrintable ? 'gap-1' : 'gap-4'}`}>
                     <EditableField label="Date" value={data.date} onChange={(value) => onDataChange('date', value)} isPrintable={isPrintable} type="date" isInvalid={errors?.has('date')}/>
                    <EditableField label="Project" value={data.projectNumber} onChange={(value) => onDataChange('projectNumber', value)} isPrintable={isPrintable} isInvalid={errors?.has('projectNumber')}/>
                </div>
            </div>
             <div className={`border-t-4 border-[#007D8C] ${isPrintable ? 'mt-2' : 'mt-4'}`}></div>
        </div>
    );
};

export default Header;