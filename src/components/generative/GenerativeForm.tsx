import { useForm } from 'react-hook-form';
import useStore from '../../store/useStore';
import { X } from 'lucide-react';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'select';
    options?: string[];
    defaultValue?: string | number;
}

interface GenerativeFormProps {
    title: string;
    fields: FormField[];
    onSubmitIntent: 'addLead' | 'updateLead' | 'sendMessage'; // Maps to store actions
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function GenerativeForm({
    title,
    fields,
    onSubmitIntent,
    onCancel,
    onSuccess
}: GenerativeFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const store = useStore();

    const onSubmit = (data: any) => {
        // Dispatch to Store (AI Intent Resolver would normally handle this mapping)
        if (onSubmitIntent === 'addLead') {
            store.addLead({
                name: data.name,
                company: data.company,
                value: Number(data.value),
                email: data.email,
                status: 'New'
            });
        }

        // Simulate AI Feedback
        store.logAction(`Executed ${onSubmitIntent} with data: ${JSON.stringify(data)}`);

        if (onSuccess) onSuccess();
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {fields.map((field) => (
                    <div key={field.name}>
                        <label className="block text-xs uppercase text-white/50 font-medium mb-1.5 ml-1">
                            {field.label}
                        </label>
                        {field.type === 'select' ? (
                            <select
                                {...register(field.name, { required: true })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                                defaultValue={field.defaultValue}
                            >
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt} className="bg-slate-800 text-white">
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type}
                                {...register(field.name, { required: true })}
                                defaultValue={field.defaultValue}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                        )}
                        {errors[field.name] && <span className="text-rose-400 text-xs ml-1 mt-1">Required</span>}
                    </div>
                ))}

                <div className="pt-4 flex gap-3">
                    <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        Submit
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
