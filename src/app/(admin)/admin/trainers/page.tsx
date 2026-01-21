'use client';
import { useEffect, useState } from 'react';
import { GymService } from '@/lib/firebase';
import { Trainer } from '@/types';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Plus, Edit2, Trash2, Dumbbell, Upload, Loader2, X, Check } from 'lucide-react';
import Input from '@/components/ui/Input';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';


export default function AdminTrainersPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Trainer>>({
        name: '',
        bio: '',
        specialties: [],
        photoUrl: '',
        active: true
    });
    const [specialtiesInput, setSpecialtiesInput] = useState('');
    const [uploading, setUploading] = useState(false);

    // Crop State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);


    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        setLoading(true);
        const data = await GymService.getTrainers();
        setTrainers(data);
        setLoading(false);
    };

    const handleOpenModal = (trainer?: Trainer) => {
        if (trainer) {
            setEditingTrainer(trainer);
            setFormData(trainer);
            setSpecialtiesInput(trainer.specialties.join(', '));
        } else {
            setEditingTrainer(null);
            setFormData({ name: '', bio: '', specialties: [], photoUrl: '', active: true });
            setSpecialtiesInput('');
        }
        setIsModalOpen(true);
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setIsCropModalOpen(true);
        }
    };

    const readFile = (file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const showCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            setUploading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (croppedImageBlob) {
                const file = new File([croppedImageBlob], "trainer-photo.jpg", { type: "image/jpeg" });
                // Now upload the CROPPED file using our new "Local/Data Matrix" logic in GymService
                const url = await GymService.processImageForDatabase(file);

                setFormData(prev => ({ ...prev, photoUrl: url }));
                setIsCropModalOpen(false);
                setImageSrc(null);
            }
        } catch (e: any) {
            console.error('Error processing image:', e);
            alert(`Error: ${e.message}`);
        } finally {
            setUploading(false);
        }
    };



    const handleSave = async () => {
        try {
            const specialtiesArray = specialtiesInput.split(',').map(s => s.trim()).filter(s => s !== '');
            const payload = { ...formData, specialties: specialtiesArray } as Trainer;

            if (editingTrainer) {
                await GymService.updateTrainer(editingTrainer.id, payload);
                alert('Entrenador actualizado');
            } else {
                await GymService.addTrainer(payload);
                alert('Entrenador creado');
            }
            setIsModalOpen(false);
            loadTrainers();
        } catch (error) {
            console.error(error);
            alert('Error al guardar datos');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este entrenador?')) return;
        try {
            await GymService.deleteTrainer(id);
            loadTrainers();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold italic text-white">
                    GESTIÓN DE <span className="text-brand-green">ENTRENADORES</span>
                </h1>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" /> AGREGAR ENTRENADOR
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : trainers.length === 0 ? (
                    <p className="text-gray-500">No hay entrenadores registrados.</p>
                ) : (
                    trainers.map(t => (
                        <Card key={t.id} noPadding className="relative group overflow-hidden">
                            <div className="h-48 bg-gray-800 relative">
                                {t.photoUrl ? (
                                    <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <Dumbbell className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                        className="text-white hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-white mb-1">{t.name}</h3>
                                <p className="text-xs text-brand-green mb-3 uppercase font-bold tracking-wider">
                                    {t.specialties.slice(0, 3).join(' • ')}
                                </p>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                    {t.bio}
                                </p>

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 text-xs" onClick={() => handleOpenModal(t)}>
                                        <Edit2 className="w-3 h-3 mr-1" /> EDITAR
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg bg-neutral-900 border-gray-800">
                        <h2 className="text-xl font-bold mb-4 text-white">
                            {editingTrainer ? 'Editar Entrenador' : 'Nuevo Entrenador'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Nombre Completo</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Biografía Corta</label>
                                <textarea
                                    className="w-full bg-black/50 border border-gray-800 rounded p-2 text-white text-sm focus:border-brand-green outline-none"
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Experto en Crosstraining con 5 años..."
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Especialidades (separadas por coma)</label>
                                <Input
                                    value={specialtiesInput}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialtiesInput(e.target.value)}
                                    placeholder="Ej. Halterofilia, Gimnasia, Running"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Foto de Perfil</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                                        ) : formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Dumbbell className="w-8 h-8 text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded border border-gray-600 inline-flex items-center transition-colors">
                                            <Upload className="w-3 h-3 mr-2" />
                                            {uploading ? 'PROCESANDO...' : 'RECORTAR Y SUBIR'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={onFileChange}
                                                disabled={uploading}
                                            />
                                        </label>
                                        <p className="text-[10px] text-gray-500 mt-1">Recomendado: 400x400px, JPG/PNG</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden URL Input Backup */}
                            <div className="hidden">
                                <label className="text-xs text-gray-500 mb-1 block">URL de Foto</label>
                                <Input
                                    value={formData.photoUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, photoUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>CANCELAR</Button>
                            <Button onClick={handleSave} disabled={uploading}>
                                {uploading ? 'ESPERE...' : 'GUARDAR'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}


            {/* Crop Modal */}
            {isCropModalOpen && imageSrc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 animate-fade-in">
                    <div className="w-full max-w-xl bg-neutral-900 rounded-lg overflow-hidden flex flex-col h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-gray-800">
                            <h3 className="text-white font-bold">Ajustar Imagen</h3>
                            <button onClick={() => setIsCropModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Image Area */}
                        <div className="relative flex-1 bg-black min-h-0">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={3 / 4}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Controls */}
                        <div className="p-4 bg-neutral-900 border-t border-gray-800 flex-shrink-0">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-xs text-gray-400">Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    className="w-48 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-green"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>CANCELAR</Button>
                                <Button onClick={showCroppedImage} disabled={uploading}>
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    {uploading ? 'PROCESANDO...' : 'CONFIRMAR Y SUBIR'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
