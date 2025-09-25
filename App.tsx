import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import PhotoEntry from './components/PhotoEntry';
import type { HeaderData, PhotoData } from './types';
import { PlusIcon, DownloadIcon, CloseIcon } from './components/icons';

declare const jspdf: any;
declare const html2canvas: any;

const initialHeaderData: HeaderData = {
    proponent: '',
    projectName: '',
    location: '',
    date: '',
    projectNumber: ''
};

const initialPhotoData: PhotoData[] = [];

const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const PreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isGenerating: boolean;
    children: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, isGenerating, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">PDF Preview</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition">
                        <CloseIcon className="h-7 w-7 text-gray-600" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto bg-gray-200 p-8">
                    <div className="space-y-8">{children}</div>
                </div>
                <div className="flex justify-end p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg mr-4 hover:bg-gray-600 transition"
                        disabled={isGenerating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700 transition disabled:bg-cyan-400 disabled:cursor-wait"
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Saving...' : 'Confirm & Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [headerData, setHeaderData] = useState<HeaderData>(initialHeaderData);
    const [photos, setPhotos] = useState<PhotoData[]>(initialPhotoData);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
        header: Set<keyof HeaderData>,
        photos: Map<number, Set<keyof PhotoData>>
    }>({ header: new Set(), photos: new Map() });

    const handleHeaderChange = useCallback((field: keyof HeaderData, value: string) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handlePhotoChange = useCallback((id: number, field: keyof Omit<PhotoData, 'id' | 'imageUrl'>, value: string) => {
        setPhotos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, []);

    const handleImageChange = useCallback((id: number, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotos(prev => prev.map(p => p.id === id ? { ...p, imageUrl: reader.result as string } : p));
        };
        reader.readAsDataURL(file);
    }, []);

    const handleAddPhoto = () => {
        const newId = photos.length > 0 ? Math.max(...photos.map(p => p.id)) + 1 : 1;
        
        const newPhoto: PhotoData = {
            id: newId,
            photoNumber: '', // Will be re-calculated below
            date: headerData.date,
            location: headerData.location,
            description: '',
            imageUrl: null,
        };
        
        setPhotos(prevPhotos => {
            const updatedPhotos = [...prevPhotos, newPhoto];
            // Re-number all photos
            return updatedPhotos.map((photo, index) => ({
                ...photo,
                photoNumber: String(index + 1)
            }));
        });
    };

    const handleRemovePhoto = useCallback((id: number) => {
        setPhotos(prevPhotos => {
            const filteredPhotos = prevPhotos.filter(p => p.id !== id);
            // Re-number all photos
            return filteredPhotos.map((photo, index) => ({
                ...photo,
                photoNumber: String(index + 1)
            }));
        });
    }, []);

    const handleMove = useCallback((id: number, direction: 'up' | 'down') => {
        setPhotos(prevPhotos => {
            const index = prevPhotos.findIndex(p => p.id === id);
            if (index === -1) return prevPhotos;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prevPhotos.length) return prevPhotos;

            const newPhotos = [...prevPhotos];
            [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];

            // Re-number all photos
            return newPhotos.map((photo, i) => ({
                ...photo,
                photoNumber: String(i + 1),
            }));
        });
    }, []);
    
    useEffect(() => {
        if (!isPrinting) return;

        const generatePdf = async () => {
            const sanitize = (str: string) => str.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
            const finalFileName = `${sanitize(headerData.projectName)}_${sanitize(headerData.location)}_Photolog.pdf`;
            
            const printContainer = document.getElementById('pdf-render-area');
            if (!printContainer) {
                console.error("PDF render container not found.");
                setIsPrinting(false);
                setIsGeneratingPdf(false);
                return;
            }

            const pages = printContainer.querySelectorAll<HTMLElement>('.pdf-page-container');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                try {
                    const canvas = await html2canvas(page, { scale: 2.5, useCORS: true, windowWidth: page.scrollWidth, windowHeight: page.scrollHeight });
                    const imgData = canvas.toDataURL('image/png');
                    
                    if (i > 0) pdf.addPage();
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                } catch (error) {
                    console.error(`Failed to render page ${i + 1}:`, error);
                    alert(`Sorry, there was an error rendering page ${i + 1}.`);
                }
            }

            pdf.save(finalFileName);
            setIsPrinting(false);
            setIsGeneratingPdf(false);
        };
        
        const timer = setTimeout(generatePdf, 100);
        return () => clearTimeout(timer);

    }, [isPrinting, headerData]);

    const handleOpenPreview = () => {
        const newErrors = {
            header: new Set<keyof HeaderData>(),
            photos: new Map<number, Set<keyof PhotoData>>()
        };

        // Validate header
        (Object.keys(headerData) as Array<keyof HeaderData>).forEach(key => {
            if (!headerData[key] || headerData[key].trim() === '') {
                newErrors.header.add(key);
            }
        });

        // Validate photos
        photos.forEach(photo => {
            const photoErrors = new Set<keyof PhotoData>();
            if (!photo.photoNumber.trim()) photoErrors.add('photoNumber');
            if (!photo.date.trim()) photoErrors.add('date');
            if (!photo.location.trim()) photoErrors.add('location');
            if (!photo.description.trim()) photoErrors.add('description');
            if (!photo.imageUrl) photoErrors.add('imageUrl');

            if (photoErrors.size > 0) {
                newErrors.photos.set(photo.id, photoErrors);
            }
        });
        
        setValidationErrors(newErrors);

        if (newErrors.header.size > 0 || newErrors.photos.size > 0) {
            alert("Please fill in all required fields, highlighted in red.");
            return;
        }
        
        setShowPreview(true);
    };

    const handleClosePreview = () => setShowPreview(false);
    const handleConfirmSave = () => {
        setShowPreview(false);
        setIsGeneratingPdf(true);
        setIsPrinting(true);
    };

    const photoPages = chunk(photos, 2);

    const printableContent = (
         <>
            {photoPages.map((pagePhotos, pageIndex) => (
                 <div key={pageIndex} className="pdf-page-container shadow-lg" style={{ width: '210mm', height: '297mm', backgroundColor: 'white' }}>
                    <div className="flex flex-col h-full p-8">
                        <Header data={headerData} onDataChange={() => {}} isPrintable={true} />
                        <hr className="border-t-4 border-cyan-600 my-4" />
                        <div className="flex-grow flex flex-col justify-around">
                            {pagePhotos.map((photo, photoIndex) => (
                                <React.Fragment key={photo.id}>
                                    <div className="flex-1 min-h-0">
                                        <PhotoEntry
                                            data={photo}
                                            onDataChange={() => {}}
                                            onImageChange={() => {}}
                                            onRemove={() => {}}
                                            onMoveUp={() => {}}
                                            onMoveDown={() => {}}
                                            isFirst={true}
                                            isLast={true}
                                            printable={true}
                                        />
                                    </div>
                                    {photoIndex === 0 && pagePhotos.length > 1 && (
                                        <hr className="border-t-2 border-cyan-600 flex-shrink-0" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="text-center font-bold pt-4">Page {pageIndex + 1} of {photoPages.length || 1}</div>
                   </div>
                </div>
            ))}
             {photoPages.length === 0 && (
                 <div className="pdf-page-container shadow-lg" style={{ width: '210mm', height: '297mm', backgroundColor: 'white' }}>
                     <div className="flex flex-col h-full p-8">
                         <Header data={headerData} onDataChange={() => {}} isPrintable={true} />
                         <hr className="border-t-4 border-cyan-600 my-4" />
                         <div className="flex-grow flex items-center justify-center text-gray-500">
                             <p className="text-xl font-bold">No photos to display.</p>
                         </div>
                         <div className="text-center font-bold pt-4">Page 1 of 1</div>
                     </div>
                 </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div>
                    <Header data={headerData} onDataChange={handleHeaderChange} errors={validationErrors.header} />
                    <hr className="border-t-4 border-cyan-600 my-6" />

                    <div className="flex flex-col">
                        {photos.map((photo, index) => (
                            <div key={photo.id}>
                                <PhotoEntry
                                    data={photo}
                                    onDataChange={(field, value) => handlePhotoChange(photo.id, field, value)}
                                    onImageChange={(file) => handleImageChange(photo.id, file)}
                                    onRemove={() => handleRemovePhoto(photo.id)}
                                    onMoveUp={() => handleMove(photo.id, 'up')}
                                    onMoveDown={() => handleMove(photo.id, 'down')}
                                    isFirst={index === 0}
                                    isLast={index === photos.length - 1}
                                    errors={validationErrors.photos.get(photo.id)}
                                />
                                {index < photos.length - 1 && (
                                    <hr className="border-t-2 border-cyan-600 my-6" />
                                )}
                            </div>
                        ))}
                    </div>

                    {photos.length === 0 && (
                         <div className="text-center py-16 text-gray-500 bg-white rounded-lg shadow-md">
                            <p className="text-xl font-bold">No photos have been added yet.</p>
                            <p className="mt-4 font-bold text-lg">Click "Add Photo" to get started.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                        onClick={handleAddPhoto}
                        className="flex items-center space-x-2 bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-cyan-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 text-lg"
                    >
                        <PlusIcon className="h-7 w-7" />
                        <span>Add Photo</span>
                    </button>
                    <button
                        onClick={handleOpenPreview}
                        disabled={isGeneratingPdf}
                        className="flex items-center space-x-2 bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 text-lg disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        <DownloadIcon className="h-7 w-7" />
                        <span>Save to PDF</span>
                    </button>
                </div>
            </div>

            <PreviewModal
                isOpen={showPreview}
                onClose={handleClosePreview}
                onConfirm={handleConfirmSave}
                isGenerating={isGeneratingPdf}
            >
                {printableContent}
            </PreviewModal>

            {isPrinting && (
                 <div id="pdf-render-area" className="absolute -top-[99999px] -left-[99999px] w-0 h-0 overflow-hidden">
                    {printableContent}
                 </div>
            )}
        </div>
    );
};

export default App;