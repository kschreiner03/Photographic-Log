import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import PhotoEntry from './components/PhotoEntry';
import type { HeaderData, PhotoData } from './types';
import { PlusIcon, DownloadIcon, CloseIcon, SaveIcon, FolderOpenIcon } from './components/icons';


declare const html2canvas: any;
declare const jspdf: any;

// A type guard to check if an object is a valid PhotoData object
const isPhotoData = (obj: any): obj is PhotoData => {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && typeof obj.id === 'number' &&
         'photoNumber' in obj && typeof obj.photoNumber === 'string' &&
         'date' in obj && typeof obj.date === 'string' &&
         'location' in obj && typeof obj.location === 'string' &&
         'description' in obj && typeof obj.description === 'string' &&
         'imageUrl' in obj;
};

// A type guard to check if an object is a valid HeaderData object
const isHeaderData = (obj: any): obj is HeaderData => {
  return typeof obj === 'object' && obj !== null &&
         'proponent' in obj && typeof obj.proponent === 'string' &&
         'projectName' in obj && typeof obj.projectName === 'string' &&
         'location' in obj && typeof obj.location === 'string' &&
         'date' in obj && typeof obj.date === 'string' &&
         'projectNumber' in obj && typeof obj.projectNumber === 'string';
};


const initialHeaderData: HeaderData = {
    proponent: '',
    projectName: '',
    location: '',
    date: '',
    projectNumber: '',
};

const initialPhotoData: PhotoData[] = [];

const App: React.FC = () => {
    const [headerData, setHeaderData] = useState<HeaderData>(initialHeaderData);
    const [photos, setPhotos] = useState<PhotoData[]>(initialPhotoData);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ header: Set<keyof HeaderData>, photos: Map<number, Set<keyof PhotoData>> }>({ header: new Set(), photos: new Map() });
    const projectUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const photoDataWithNumbers = photos.map((photo, index) => ({
            ...photo,
            photoNumber: String(index + 1),
        }));
        if (JSON.stringify(photos) !== JSON.stringify(photoDataWithNumbers)) {
            setPhotos(photoDataWithNumbers);
        }
    }, [photos.length]);

    const handleHeaderChange = (field: keyof HeaderData, value: string) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoDataChange = (id: number, field: keyof Omit<PhotoData, 'id' | 'imageUrl'>, value: string) => {
        setPhotos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    
    const handleImageChange = (id: number, file: File) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('Unsupported file type. Please upload a JPG or PNG image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            
            const img = new Image();
            img.onload = () => {
                const width = img.width;
                const height = img.height;

                // Vertical image: preserve aspect ratio, use original image
                if (height > width) {
                    setPhotos(prev => prev.map(p => p.id === id ? { ...p, imageUrl: result } : p));
                    return;
                }

                // Horizontal or square image: auto-crop to 4:3
                const targetAspect = 4 / 3;
                let sourceWidth, sourceHeight, sx, sy;

                const sourceAspect = width / height;

                if (sourceAspect > targetAspect) { // Wider than target: crop sides
                    sourceHeight = height;
                    sourceWidth = height * targetAspect;
                    sx = (width - sourceWidth) / 2;
                    sy = 0;
                } else { // Taller than target: crop top/bottom
                    sourceWidth = width;
                    sourceHeight = width / targetAspect;
                    sx = 0;
                    sy = (height - sourceHeight) / 2;
                }

                const canvas = document.createElement('canvas');
                // Set a reasonable output resolution for quality
                const outputWidth = 1200;
                canvas.width = outputWidth;
                canvas.height = outputWidth / targetAspect; // 900

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.drawImage(img, sx, sy, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

                const croppedImageUrl = canvas.toDataURL('image/jpeg');
                setPhotos(prev => prev.map(p => p.id === id ? { ...p, imageUrl: croppedImageUrl } : p));
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
    };

    const addPhoto = () => {
        const newId = Date.now();
        const newPhotoNumber = String(photos.length + 1);
        setPhotos(prev => [...prev, { id: newId, photoNumber: newPhotoNumber, date: '', location: '', description: '', imageUrl: null }]);
    };

    const removePhoto = (id: number) => {
        const newPhotos = photos.filter(p => p.id !== id).map((photo, index) => ({
            ...photo,
            photoNumber: String(index + 1),
        }));
        setPhotos(newPhotos);
    };
    
    const movePhoto = (id: number, direction: 'up' | 'down') => {
        const index = photos.findIndex(p => p.id === id);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === photos.length - 1)) {
            return;
        }
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const newPhotos = [...photos];
        [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
        
        const renumberedPhotos = newPhotos.map((photo, idx) => ({
            ...photo,
            photoNumber: String(idx + 1)
        }));

        setPhotos(renumberedPhotos);
    };

    const validateForm = (): boolean => {
        const newErrors = { header: new Set<keyof HeaderData>(), photos: new Map<number, Set<keyof PhotoData>>() };
        let isValid = true;

        Object.keys(headerData).forEach(key => {
            if (!headerData[key as keyof HeaderData]) {
                newErrors.header.add(key as keyof HeaderData);
                isValid = false;
            }
        });

        photos.forEach(photo => {
            const photoErrors = new Set<keyof PhotoData>();
            if (!photo.date) photoErrors.add('date');
            if (!photo.location) photoErrors.add('location');
            if (!photo.description) photoErrors.add('description');
            if (!photo.imageUrl) photoErrors.add('imageUrl');

            if (photoErrors.size > 0) {
                newErrors.photos.set(photo.id, photoErrors);
                isValid = false;
            }
        });
        
        setErrors(newErrors);
        return isValid;
    };

    const generatePdfPreview = async () => {
        if (!validateForm()) {
            alert("Please fill in all required fields before saving.");
            return;
        }

        setIsSaving(true);
        const printableContent = document.getElementById('printable-content');
        if (!printableContent) {
            setIsSaving(false);
            return;
        }

        printableContent.style.display = 'block';

        const pages = printableContent.getElementsByClassName('printable-page');
        const generatedImages: string[] = [];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i] as HTMLElement;
            const canvas = await html2canvas(page, { scale: 2, useCORS: true });
            generatedImages.push(canvas.toDataURL('image/png', 1.0));
        }

        printableContent.style.display = 'none';
        setPreviewContent(generatedImages);
        setShowPreview(true);
        setIsSaving(false);
    };

    const savePdf = () => {
        const pdf = new jspdf.jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        previewContent.forEach((imgData, index) => {
            if (index > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        });

        const safeProjectNumber = headerData.projectNumber.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project_number';
        const safeProjectName = headerData.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project_name';
        const filename = `${safeProjectNumber}_${safeProjectName}_Photolog.pdf`;

        pdf.save(filename);
        setShowPreview(false);
    };

    const handleSaveProject = () => {
        const projectData = {
            headerData,
            photos,
        };
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeProjectNumber = headerData.projectNumber.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project_number';
        const safeProjectName = headerData.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project_name';
        a.href = url;
        a.download = `${safeProjectNumber}_${safeProjectName}_Photolog.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleOpenProject = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);

                if (data && isHeaderData(data.headerData) && Array.isArray(data.photos) && data.photos.every(isPhotoData)) {
                    setHeaderData(data.headerData);
                    setPhotos(data.photos);
                } else {
                    throw new Error("Invalid project file format.");
                }
            } catch (error) {
                console.error("Failed to parse project file:", error);
                alert("Could not open project. Please select a valid project file created by this application.");
            } finally {
                // Reset the file input so the same file can be opened again
                if (projectUploadRef.current) {
                    projectUploadRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };


    const chunkPhotos = (photos: PhotoData[], chunkSize: number): PhotoData[][] => {
        const chunks: PhotoData[][] = [];
        for (let i = 0; i < photos.length; i += chunkSize) {
            chunks.push(photos.slice(i, i + chunkSize));
        }
        return chunks;
    };
    
    const photoPages = chunkPhotos(photos, 2);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <div className="text-xl font-bold">Generating Preview...</div>
                        <div className="mt-2 text-gray-600">Please wait, this may take a moment.</div>
                    </div>
                </div>
            )}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-40 p-4">
                    <div className="w-full max-w-4xl flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">PDF Preview</h2>
                        <div>
                             <button onClick={() => setShowPreview(false)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition duration-300 mr-2">
                                Cancel
                            </button>
                            <button onClick={savePdf} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 transition duration-300">
                                Confirm & Save
                            </button>
                        </div>
                    </div>
                    <div className="w-full max-w-4xl bg-white overflow-y-auto" style={{ height: '80vh' }}>
                        {previewContent.map((img, index) => (
                            <img key={index} src={img} alt={`Preview Page ${index + 1}`} className="w-full h-auto block" />
                        ))}
                    </div>
                </div>
            )}

            <Header data={headerData} onDataChange={handleHeaderChange} errors={errors.header}/>

            <div className="space-y-6">
                {photos.map((photo, index) => (
                    <React.Fragment key={photo.id}>
                        <PhotoEntry
                            data={photo}
                            onDataChange={(field, value) => handlePhotoDataChange(photo.id, field, value)}
                            onImageChange={(file) => handleImageChange(photo.id, file)}
                            onRemove={() => removePhoto(photo.id)}
                            onMoveUp={() => movePhoto(photo.id, 'up')}
                            onMoveDown={() => movePhoto(photo.id, 'down')}
                            isFirst={index === 0}
                            isLast={index === photos.length - 1}
                            errors={errors.photos.get(photo.id)}
                        />
                         {index < photos.length - 1 && <hr className="border-t-4 border-cyan-600" />}
                    </React.Fragment>
                ))}
            </div>

            {photos.length === 0 && (
                <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-700">Your Photographic Log is Empty</h2>
                    <p className="text-gray-500 mt-2">Click "Add Photo" to start building your log.</p>
                </div>
            )}

            <div className="mt-8 flex justify-end items-center flex-wrap gap-4">
                <input type="file" accept=".json" ref={projectUploadRef} onChange={handleOpenProject} className="hidden" />
                 <button onClick={() => projectUploadRef.current?.click()} disabled={isSaving} className="flex items-center space-x-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition duration-300 disabled:opacity-50">
                    <FolderOpenIcon />
                    <span>Open Project</span>
                </button>
                <button onClick={handleSaveProject} disabled={isSaving} className="flex items-center space-x-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50">
                    <SaveIcon />
                    <span>Save Project</span>
                </button>
                <button onClick={addPhoto} disabled={isSaving} className="flex items-center space-x-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 transition duration-300 disabled:opacity-50">
                    <PlusIcon />
                    <span>Add Photo</span>
                </button>
                <button onClick={generatePdfPreview} disabled={isSaving || photos.length === 0} className="flex items-center space-x-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50">
                    <DownloadIcon />
                    <span>Save to PDF</span>
                </button>
            </div>
            
            <div id="printable-content" className="hidden">
                {photoPages.map((pagePhotos, pageIndex) => (
                    <div key={pageIndex} className="printable-page bg-white w-[210mm] h-[297mm] p-[10mm] flex flex-col">
                        <Header data={headerData} onDataChange={() => {}} isPrintable={true} />
                        <div className="flex-grow flex flex-col justify-around">
                            {pagePhotos.map((photo, photoIndex) => (
                                <React.Fragment key={photo.id}>
                                    <PhotoEntry data={photo} onDataChange={() => {}} onImageChange={() => {}} onRemove={() => {}} onMoveUp={() => {}} onMoveDown={() => {}} isFirst={false} isLast={false} printable={true} />
                                    {photoIndex < pagePhotos.length - 1 && <hr className="border-t-2 border-cyan-600 my-2" />}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-auto pt-2">
                           Page {pageIndex + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;