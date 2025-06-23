import React from 'react';

const ConfirmationModal = ({ message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="card-corporate w-full max-w-sm text-gray-900">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirmación Necesaria</h3>
                <p className="text-gray-700 mb-4 text-center">{message}</p>
                {children}
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="btn-corporate-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-corporate-primary"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
