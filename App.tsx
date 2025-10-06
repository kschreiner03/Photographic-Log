import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PhotoEntry from './components/PhotoEntry';
import type { HeaderData, PhotoData } from './types';
import { PlusIcon, DownloadIcon, SaveIcon, FolderOpenIcon, CloseIcon } from './components/icons';

// @ts-ignore
const { jsPDF } = window.jspdf;

// Helper function to get image dimensions asynchronously
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = (err) => reject(err);
        img.src = url;
    });
};


const App: React.FC = () => {
    const [headerData, setHeaderData] = useState<HeaderData>({
        proponent: '',
        projectName: '',
        location: '',
        date: '',
        projectNumber: '',
    });

    const [photosData, setPhotosData] = useState<PhotoData[]>([]);
    
    const [errors, setErrors] = useState(new Set<string>());
    const [showUnsupportedFileModal, setShowUnsupportedFileModal] = useState<boolean>(false);
    const [showValidationErrorModal, setShowValidationErrorModal] = useState<boolean>(false);

    useEffect(() => {
        if (showUnsupportedFileModal || showValidationErrorModal) {
            // Using a direct MP3 link for the "sad trombone" sound effect.
            const soundUrl = 'https://www.myinstants.com/media/sounds/sadtrombone.swf.mp3';
            const audio = new Audio(soundUrl);
            audio.play().catch(error => {
                // Autoplay can be blocked by browsers, so we log errors.
                console.error("Audio playback failed:", error);
            });
        }
    }, [showUnsupportedFileModal, showValidationErrorModal]);

    const handleHeaderChange = (field: keyof HeaderData, value: string) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoDataChange = (id: number, field: keyof Omit<PhotoData, 'id' | 'imageUrl'>, value: string) => {
        setPhotosData(prev => prev.map(photo => photo.id === id ? { ...photo, [field]: value } : photo));
    };
    
    const autoCropImage = (imageUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(imageUrl); // Fallback
                    return;
                }
    
                const targetAspectRatio = 4 / 3;
                const originalAspectRatio = img.width / img.height;
    
                // Use a standard high-res canvas for quality
                const canvasWidth = 1024;
                const canvasHeight = 768; // 1024 / (4/3)
    
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
    
                // Fill canvas with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
    
                let drawWidth, drawHeight, drawX, drawY;
    
                if (originalAspectRatio > targetAspectRatio) {
                    // Image is wider than 4:3 (needs letterboxing)
                    drawWidth = canvas.width;
                    drawHeight = drawWidth / originalAspectRatio;
                    drawX = 0;
                    drawY = (canvas.height - drawHeight) / 2;
                } else {
                    // Image is narrower than 4:3 (needs pillarboxing)
                    drawHeight = canvas.height;
                    drawWidth = drawHeight * originalAspectRatio;
                    drawY = 0;
                    drawX = (canvas.width - drawWidth) / 2;
                }
    
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.src = imageUrl;
        });
    };
    
    const handleImageChange = (id: number, file: File) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setShowUnsupportedFileModal(true);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const img = new Image();
            img.onload = async () => {
                 const finalImageUrl = await autoCropImage(dataUrl);
                 setPhotosData(prev => prev.map(photo => photo.id === id ? { ...photo, imageUrl: finalImageUrl } : photo));
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const addPhoto = () => {
        const newId = photosData.length > 0 ? Math.max(...photosData.map(p => p.id)) + 1 : 1;
        setPhotosData(prev => [
            ...prev,
            {
                id: newId,
                photoNumber: String(prev.length + 1),
                date: '',
                location: '',
                description: '',
                imageUrl: null,
            }
        ]);
    };

    const renumberPhotos = (photos: PhotoData[]) => {
        return photos.map((photo, index) => ({ ...photo, photoNumber: String(index + 1) }));
    };

    const removePhoto = (id: number) => {
        setPhotosData(prev => renumberPhotos(prev.filter(photo => photo.id !== id)));
    };

    const movePhoto = (id: number, direction: 'up' | 'down') => {
        const index = photosData.findIndex(p => p.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= photosData.length) return;

        const newPhotos = [...photosData];
        [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
        
        setPhotosData(renumberPhotos(newPhotos));
    };

    const validateForm = (): boolean => {
        const newErrors = new Set<string>();
        (Object.keys(headerData) as Array<keyof HeaderData>).forEach(key => {
            if (!headerData[key]) {
                newErrors.add(key);
            }
        });
        photosData.forEach(photo => {
            const prefix = `photo-${photo.id}-`;
            if (!photo.date) newErrors.add(`${prefix}date`);
            if (!photo.location) newErrors.add(`${prefix}location`);
            if (!photo.description) newErrors.add(`${prefix}description`);
            if (!photo.imageUrl) newErrors.add(`${prefix}imageUrl`);
        });

        setErrors(newErrors);
        if (newErrors.size > 0) {
            setShowValidationErrorModal(true);
            return false;
        }
        return true;
    };

    const handleSavePdf = async () => {
        if (!validateForm()) return;
    
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - margin * 2;
    
            const getMaxWidth = (docInstance: any, text: string) => {
                const lines = text.split('\n');
                return Math.max(...lines.map(line => docInstance.getTextWidth(line)));
            };
    
            const drawHeader = (docInstance: any) => {
                let yPos = margin;
                const logoUrl = "https://ik.imagekit.io/fzpijprte/XTerraLogo2019_Horizontal.jpg?updatedAt=1758827714962";
                docInstance.addImage(logoUrl, 'JPEG', margin, yPos, 40, 10);
                
                docInstance.setFontSize(18);
                docInstance.setFont('times', 'bold');
                docInstance.setTextColor(0, 125, 140);
                docInstance.text('PHOTOGRAPHIC LOG', pageWidth / 2, yPos + 7, { align: 'center' });
                
                docInstance.setTextColor(0, 0, 0);

                const lloydminsterLines = '6208 48th Street\nLloydminster, AB\nT9V 2G1\nTEL (780) 875-1442\nFAX (780) 871-0925';
                const saskatoonLines = '100-303 Wheeler Pl.\nSaskatoon, SK\nS7P 0A4\nTEL (306) 373-1110\nFAX (306) 373-2444';

                docInstance.setFontSize(7);
                docInstance.setFont('times', 'normal');
                
                const lloydminsterWidth = getMaxWidth(docInstance, lloydminsterLines);
                const saskatoonWidth = getMaxWidth(docInstance, saskatoonLines);
                
                const lloydminsterX = pageWidth - margin;
                docInstance.text(lloydminsterLines, lloydminsterX, yPos, { align: 'right' });

                const saskatoonX = lloydminsterX - lloydminsterWidth - 3;
                docInstance.text(saskatoonLines, saskatoonX, yPos, { align: 'right' });
                
                yPos += 18;
                docInstance.setLineWidth(0.5);
                docInstance.setDrawColor(0, 125, 140);
                docInstance.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;
    
                docInstance.setFontSize(12);
                const textY = yPos;
                const col1X = margin;
                const col2X = pageWidth * 0.6;
                const col1MaxWidth = col2X - col1X - 5;
                const col2MaxWidth = pageWidth - margin - col2X;
                
                const drawField = (label: string, value: string, x: number, y: number, maxWidth: number): number => {
                    const valueOrDefault = value || ' '; // Ensure value is not empty for measurements
                    docInstance.setFont('times', 'bold');
                    const labelText = `${label}:`;
                    const labelWidth = docInstance.getTextWidth(labelText);
                    
                    docInstance.setFont('times', 'normal');
                    const valueX = x + labelWidth; // Position immediately after label
                    const valueMaxWidth = maxWidth - labelWidth;

                    // Prepend space to the value itself for consistent spacing
                    const valueLines = docInstance.splitTextToSize(` ${valueOrDefault}`, valueMaxWidth);
                    const textBlockHeight = docInstance.getTextDimensions(valueLines).h;
                    
                    docInstance.setFont('times', 'bold');
                    docInstance.text(labelText, x, y);
                    
                    docInstance.setFont('times', 'normal');
                    docInstance.text(valueLines, valueX, y);

                    // Return the Y position for the start of the NEXT element
                    return y + textBlockHeight;
                };

                let col1Y = textY;
                let col2Y = textY;
                const fieldGap = 2; // 2mm gap between fields

                col1Y = drawField('Proponent', headerData.proponent, col1X, col1Y, col1MaxWidth) + fieldGap;
                col1Y = drawField('Project Name', headerData.projectName, col1X, col1Y, col1MaxWidth) + fieldGap;
                col1Y = drawField('Location', headerData.location, col1X, col1Y, col1MaxWidth);

                col2Y = drawField('Date', headerData.date, col2X, col2Y, col2MaxWidth) + fieldGap;
                col2Y = drawField('Project', headerData.projectNumber, col2X, col2Y, col2MaxWidth);

                yPos = Math.max(col1Y, col2Y) + 3;
                
                docInstance.setLineWidth(0.5);
                docInstance.line(margin, yPos, pageWidth - margin, yPos);
                return yPos + 8; 
            };
    
            const footerHeight = 15;
            const maxYPos = pageHeight - footerHeight;

            const drawFooter = (docInstance: any, pageNum: number) => {
                docInstance.setFontSize(10);
                docInstance.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
            };

            const calculateEntryHeight = async (docInstance: any, photo: PhotoData) => {
                const tempDoc = new jsPDF({ format: 'letter', unit: 'mm' });
                const gap = 5;
                const availableWidth = contentWidth - gap;
                const textBlockWidth = availableWidth * 0.40;
                const imageBlockWidth = availableWidth * 0.60;
                tempDoc.setFontSize(14);

                let textHeight = 0;
                
                const measureField = (label, value, isDesc = false) => {
                    if (isDesc) {
                         textHeight += tempDoc.getTextDimensions(label, { maxWidth: textBlockWidth }).h + 2; // Label
                         return tempDoc.getTextDimensions(value, { maxWidth: textBlockWidth }).h; // Value
                    }
                    const combined = `${label}: ${value}`;
                    return tempDoc.getTextDimensions(combined, { maxWidth: textBlockWidth }).h + 4;
                };

                textHeight += measureField('Photo', photo.photoNumber);
                textHeight += measureField('Date', photo.date);
                textHeight += measureField('Location', photo.location);
                textHeight += measureField('Description', photo.description, true);

                let scaledHeight = 0;
                if (photo.imageUrl) {
                    const { width, height } = await getImageDimensions(photo.imageUrl);
                    scaledHeight = height * (imageBlockWidth / width);
                }
                return Math.max(textHeight, scaledHeight);
            };

            const drawPhotoEntry = async (docInstance: any, photo: PhotoData, yStart: number) => {
                const gap = 5;
                const availableWidth = contentWidth - gap;
                const textBlockWidth = availableWidth * 0.40;
                const imageBlockWidth = availableWidth * 0.60;
                const imageX = margin + textBlockWidth + gap;
                docInstance.setFontSize(14);
                
                let textY = yStart;

                const drawTextField = (label: string, value: string, isDesc = false) => {
                    if (isDesc) {
                        docInstance.setFont('times', 'bold');
                        docInstance.text(label, margin, textY);
                        textY += docInstance.getTextDimensions(label, { maxWidth: textBlockWidth }).h + 2;
                        
                        docInstance.setFont('times', 'normal');
                        const dims = docInstance.getTextDimensions(value, { maxWidth: textBlockWidth });
                        docInstance.text(value, margin, textY, { maxWidth: textBlockWidth });
                        textY += dims.h;
                        return;
                    }

                    docInstance.setFont('times', 'bold');
                    const labelText = `${label}:`;
                    docInstance.text(labelText, margin, textY);
                    
                    docInstance.setFont('times', 'normal');
                    const labelWidth = docInstance.getTextWidth(labelText);
                    const valueX = margin + labelWidth;
                    const valueMaxWidth = textBlockWidth - labelWidth;
                    const dims = docInstance.getTextDimensions(` ${value}`, { maxWidth: valueMaxWidth });
                    docInstance.text(` ${value}`, valueX, textY, { maxWidth: valueMaxWidth });
                    textY += dims.h + 4;
                };

                drawTextField('Photo', photo.photoNumber);
                drawTextField('Date', photo.date);
                drawTextField('Location', photo.location);
                drawTextField('Description:', photo.description, true);

                const textBlockHeight = textY - yStart;

                let scaledHeight = 0;
                if (photo.imageUrl) {
                    const { width, height } = await getImageDimensions(photo.imageUrl);
                    scaledHeight = height * (imageBlockWidth / width);
                    docInstance.addImage(photo.imageUrl, 'JPEG', imageX, yStart, imageBlockWidth, scaledHeight);
                }

                return yStart + Math.max(textBlockHeight, scaledHeight);
            };
            
            let currentPage = 1;
            let yPos = drawHeader(doc);
            const separatorHeight = 15;

            for (const [index, photo] of photosData.entries()) {
                const entryHeight = await calculateEntryHeight(doc, photo);
                const spaceNeeded = entryHeight + separatorHeight;
                
                if (yPos + spaceNeeded > maxYPos) {
                    drawFooter(doc, currentPage);
                    doc.addPage();
                    currentPage++;
                    yPos = drawHeader(doc);
                }

                yPos = await drawPhotoEntry(doc, photo, yPos);
                
                yPos += separatorHeight / 2;
                doc.setLineWidth(0.5);
                doc.setDrawColor(0, 125, 140);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += separatorHeight / 2;
            }

            drawFooter(doc, currentPage);
            
            const sanitize = (name: string) => name.replace(/[^a-z0-9_]/gi, '-').toLowerCase();
            const filename = `${sanitize(headerData.projectNumber) || 'project'}_${sanitize(headerData.projectName) || 'photolog'}_Photolog.pdf`;
            
            if (window.electronAPI) {
                const pdfData = doc.output('arraybuffer');
                await window.electronAPI.savePdf(pdfData, filename);
            } else {
                alert("This feature requires the desktop application environment.");
            }
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("An unexpected error occurred while generating the PDF. Please check the console for details.");
        }
    };

    const handleSaveProject = async () => {
        const state = { headerData, photosData };
        const sanitize = (name: string) => name.replace(/[^a-z0-9_]/gi, '-').toLowerCase();
        const filename = `${sanitize(headerData.projectNumber) || 'project'}_${sanitize(headerData.projectName) || 'photolog'}_Photolog.json`;
        const jsonString = JSON.stringify(state, null, 2);

        if (window.electronAPI) {
            await window.electronAPI.saveProject(jsonString, filename);
        } else {
            alert("This feature requires the desktop application environment.");
        }
    };

    const handleLoadProject = async () => {
        if (!window.electronAPI) {
            alert("This feature requires the desktop application environment.");
            return;
        }

        const fileContent = await window.electronAPI.loadProject();
        if (!fileContent) return; // User cancelled dialog or error occurred

        try {
            const { headerData: loadedHeader, photosData: loadedPhotos } = JSON.parse(fileContent);
            if (loadedHeader && loadedPhotos && Array.isArray(loadedPhotos)) {
                setHeaderData(loadedHeader);
                setPhotosData(loadedPhotos);
            } else {
                alert('Invalid project file format.');
            }
        } catch (err) {
            alert('Error parsing project file. Ensure it is a valid JSON file.');
            console.error(err);
        }
    };

    const getPhotoErrors = (id: number): Set<keyof PhotoData> => {
        const photoErrors = new Set<keyof PhotoData>();
        errors.forEach(errorKey => {
            const prefix = `photo-${id}-`;
            if (errorKey.startsWith(prefix)) {
                photoErrors.add(errorKey.substring(prefix.length) as keyof PhotoData);
            }
        });
        return photoErrors;
    };
    
    const getHeaderErrors = (): Set<keyof HeaderData> => {
        const headerErrors = new Set<keyof HeaderData>();
        errors.forEach(errorKey => {
            if (!errorKey.startsWith('photo-')) {
                headerErrors.add(errorKey as keyof HeaderData);
            }
        });
        return headerErrors;
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex flex-wrap justify-end gap-2 mb-4">
                    <button onClick={handleLoadProject} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 transition duration-200">
                        <FolderOpenIcon /> <span>Open Project</span>
                    </button>
                    <button onClick={handleSaveProject} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 transition duration-200">
                        <SaveIcon /> <span>Save Project</span>
                    </button>
                    <button onClick={handleSavePdf} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 transition duration-200">
                        <DownloadIcon /> <span>Save to PDF</span>
                    </button>
                </div>
                <div className="main-content">
                    <Header data={headerData} onDataChange={handleHeaderChange} errors={getHeaderErrors()} />
                    <div className="space-y-8">
                        {photosData.map((photo, index) => (
                           <React.Fragment key={photo.id}>
                                {index > 0 && <div className="border-t-4 border-[#007D8C] my-8" />}
                                <PhotoEntry
                                    data={photo}
                                    onDataChange={(field, value) => handlePhotoDataChange(photo.id, field, value)}
                                    onImageChange={(file) => handleImageChange(photo.id, file)}
                                    onRemove={() => removePhoto(photo.id)}
                                    onMoveUp={() => movePhoto(photo.id, 'up')}
                                    onMoveDown={() => movePhoto(photo.id, 'down')}
                                    isFirst={index === 0}
                                    isLast={index === photosData.length - 1}
                                    errors={getPhotoErrors(photo.id)}
                                />
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={addPhoto}
                        className="bg-[#007D8C] hover:bg-[#006b7a] text-white font-bold py-3 px-6 rounded-lg shadow-md inline-flex items-center gap-2 transition duration-200 text-lg"
                    >
                        <PlusIcon />
                        <span>Add Photo</span>
                    </button>
                </div>
                {photosData.length > 0 && <div className="border-t-4 border-[#007D8C] my-8" />}
            </div>
             {showUnsupportedFileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl text-center relative max-w-md transform scale-95 hover:scale-100 transition-transform duration-300">
                        <button
                            onClick={() => setShowUnsupportedFileModal(false)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Close"
                        >
                            <CloseIcon className="h-6 w-6" />
                        </button>
                        <img
                            src="https://ik.imagekit.io/fzpijprte/200.gif?updatedAt=1758919911063"
                            alt="Unsupported file type animation"
                            className="mx-auto mb-4 w-40 h-40"
                        />
                        <h3 className="text-2xl font-bold mb-2 text-gray-800">Unsupported File Type</h3>
                        <p className="text-gray-600">
                            Please upload a supported image file.
                        </p>
                        <p className="text-sm text-gray-500 mt-3">
                            Supported formats: <strong>JPG, PNG</strong>
                        </p>
                    </div>
                </div>
            )}
            {showValidationErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-lg shadow-2xl text-center relative max-w-md transform scale-95 hover:scale-100 transition-transform duration-300">
                        <button
                            onClick={() => setShowValidationErrorModal(false)}
                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                            aria-label="Close"
                        >
                            <CloseIcon className="h-6 w-6" />
                        </button>
                        <img
                            src="https://ik.imagekit.io/fzpijprte/200.gif?updatedAt=1758919911063"
                            alt="Missing information animation"
                            className="mx-auto mb-4 w-40 h-40"
                        />
                        <h3 className="text-2xl font-bold mb-2 text-gray-800">Missing Information</h3>
                        <p className="text-gray-600">
                            Please fill in all required fields.
                        </p>
                        <p className="text-sm text-gray-500 mt-3">
                            Missing fields are highlighted in red.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;