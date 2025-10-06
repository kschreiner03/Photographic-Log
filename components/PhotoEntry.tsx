import React from 'react';
import type { PhotoData } from '../types';
import { TrashIcon, CameraIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface PhotoEntryProps {
  data: PhotoData;
  onDataChange: (field: keyof Omit<PhotoData, 'id' | 'imageUrl'>, value: string) => void;
  onImageChange: (file: File) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  printable?: boolean;
  errors?: Set<keyof PhotoData>;
}

const EditableField: React.FC<{ label: string; value: string; onChange: (value: string) => void; isTextArea?: boolean; type?: 'text' | 'date', printable?: boolean; isInvalid?: boolean; readOnly?: boolean }> = ({ label, value, onChange, isTextArea = false, type = 'text', printable = false, isInvalid = false, readOnly = false }) => {
    const commonClasses = "p-1 w-full bg-transparent focus:outline-none transition duration-200 text-base font-normal text-black min-w-0";

    if (printable) {
        if (isTextArea) {
            return (
                <div>
                    <label className="block text-base font-bold text-black">{label}:</label>
                    <p className="mt-1 text-base font-normal text-black whitespace-pre-wrap">{value || '\u00A0'}</p>
                </div>
            );
        }
        return (
            <div className="flex items-baseline gap-2">
                <span className="block text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</span>
                <span className="text-base font-normal text-black break-words">{value || '\u00A0'}</span>
            </div>
        );
    }

    if (readOnly) {
        return (
            <div className="flex items-baseline gap-2">
                <label className="block text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</label>
                <span className="p-1 w-full text-base font-normal text-black">{value}</span>
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
            if (part === 'month') newDate.month = newValue;
            if (part === 'day') newDate.day = newValue;
            if (part === 'year') newDate.year = newValue;

            if (newDate.month && newDate.day && newDate.year) {
                onChange(`${newDate.month} ${newDate.day}, ${newDate.year}`);
            } else {
                onChange([newDate.month, newDate.day, newDate.year].filter(Boolean).join(' '));
            }
        };

        const selectClasses = `${commonClasses} border-b-2 ${isInvalid ? 'border-red-500' : 'border-gray-300'} focus:border-[#007D8C]`;

        return (
            <div className="flex items-baseline gap-2">
                <label className="block text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</label>
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

    if (isTextArea) {
        // Description field (stacked layout)
        return (
            <div>
                <label className="block text-base font-bold text-black">{label}:</label>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    className={`mt-1 ${commonClasses} ${isInvalid ? 'border-b-2 border-red-500' : ''}`}
                />
            </div>
        );
    }
    
    return (
        <div className="flex items-baseline gap-2">
            <label className="block text-base font-bold text-black flex-shrink-0 whitespace-nowrap">{label}:</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${commonClasses} ${isInvalid ? 'border-b-2 border-red-500' : ''}`}
            />
        </div>
    );
};


const PhotoEntry: React.FC<PhotoEntryProps> = ({ data, onDataChange, onImageChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, printable = false, errors }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageChange(e.target.files[0]);
        }
    };

    const showControls = !printable;
    const isImageInvalid = !!errors?.has('imageUrl');

    return (
        <div className="bg-white p-6 shadow-md rounded-lg break-inside-avoid">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:items-start">
                {/* Left Column: Information */}
                <div className="flex flex-col space-y-4 md:col-span-1 min-w-0">
                     <div className="flex justify-between items-center">
                        <div className="flex-grow min-w-0">
                            <EditableField label="Photo" value={data.photoNumber} onChange={(v) => onDataChange('photoNumber', v)} printable={printable} isInvalid={errors?.has('photoNumber')} readOnly />
                        </div>
                        {showControls && (
                            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                               <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition duration-200" aria-label="Move Up">
                                    <ArrowUpIcon className="h-7 w-7" />
                                </button>
                                <button onClick={onMoveDown} disabled={isLast} className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition duration-200" aria-label="Move Down">
                                    <ArrowDownIcon className="h-7 w-7" />
                                </button>
                                <button onClick={onRemove} className="p-1 text-red-500 hover:text-red-700 transition duration-200" aria-label="Remove Photo">
                                    <TrashIcon className="h-7 w-7" />
                                </button>
                            </div>
                        )}
                    </div>
                    <EditableField label="Date" value={data.date} onChange={(v) => onDataChange('date', v)} type="date" printable={printable} isInvalid={errors?.has('date')} />
                    <EditableField label="Location" value={data.location} onChange={(v) => onDataChange('location', v)} printable={printable} isInvalid={errors?.has('location')} />
                    <EditableField label="Description" value={data.description} onChange={(v) => onDataChange('description', v)} isTextArea printable={printable} isInvalid={errors?.has('description')} />
                </div>
                {/* Right Column: Image */}
                <div className="flex items-center justify-center md:col-span-2">
                    <div className={`w-full rounded-lg flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${isImageInvalid ? 'ring-2 ring-red-500 ring-inset' : ''}`}>
                        <input
                            type="file"
                            accept="image/jpeg, image/png"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Upload image"
                            disabled={printable}
                        />
                        {data.imageUrl ? (
                            <img src={data.imageUrl} alt="Uploaded" className="object-contain max-w-full max-h-[280px]" />
                        ) : (
                            <div className="text-center text-gray-500 p-4 h-[280px] w-full flex flex-col justify-center items-center">
                                <CameraIcon className="mx-auto h-20 w-20 text-gray-400"/>
                                <p className="mt-2 text-base font-bold">Click or drag to upload an image</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoEntry;