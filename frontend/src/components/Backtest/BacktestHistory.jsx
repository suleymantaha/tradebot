import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const BacktestHistory = ({ onSelectBacktest }) => {
    const [backtests, setBacktests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBacktest, setSelectedBacktest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchBacktests();
    }, []);

    const fetchBacktests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/backtest/list', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBacktests(data.data || []);
            } else {
                console.error('Failed to fetch backtests');
            }
        } catch (error) {
            console.error('Error fetching backtests:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteBacktest = async (backtestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/backtest/delete/${backtestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setBacktests(prev => prev.filter(bt => bt.id !== backtestId));
            } else {
                console.error('Failed to delete backtest');
            }
        } catch (error) {
            console.error('Error deleting backtest:', error);
        }
    };

    const viewBacktestDetail = async (backtestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/backtest/detail/${backtestId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedBacktest(data.data);
                setIsModalOpen(true);
            } else {
                console.error('Failed to fetch backtest detail');
            }
        } catch (error) {
            console.error('Error fetching backtest detail:', error);
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
        } catch {
            return dateString;
        }
    };

    const getReturnColor = (returnValue) => {
        if (returnValue > 0) return 'text-green-500';
        if (returnValue < 0) return 'text-red-500';
        return 'text-gray-500';
    };

    const getWinRateColor = (winRate) => {
        if (winRate >= 60) return 'text-green-500';
        if (winRate >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded mb-2"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Backtest Geçmişi
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Önceki backtest sonuçlarınızı görüntüleyin
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {backtests.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📊</div>
                            <p className="text-gray-500 dark:text-gray-400">Henüz backtest yapılmamış</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Sembol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Interval
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Tarih Aralığı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Getiri
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Başarı Oranı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        İşlem Sayısı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Test Modu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Oluşturma
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {backtests.map((backtest) => (
                                    <tr key={backtest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {backtest.symbol}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {backtest.interval}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {backtest.start_date} - {backtest.end_date}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getReturnColor(backtest.total_return)}`}>
                                            {backtest.total_return > 0 ? '+' : ''}{backtest.total_return.toFixed(2)}%
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getWinRateColor(backtest.win_rate)}`}>
                                            {backtest.win_rate.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {backtest.total_trades}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${backtest.test_mode === 'true'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                }`}>
                                                {backtest.test_mode === 'true' ? 'Test' : 'Gerçek'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {formatDate(backtest.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => viewBacktestDetail(backtest.id)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                            >
                                                Detay
                                            </button>
                                            <button
                                                onClick={() => deleteBacktest(backtest.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {isModalOpen && selectedBacktest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Backtest Detayı - {selectedBacktest.symbol}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Başlangıç Sermayesi</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        ${selectedBacktest.initial_capital.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Final Sermaye</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        ${selectedBacktest.final_capital.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Getiri</div>
                                    <div className={`text-lg font-semibold ${getReturnColor(selectedBacktest.total_return)}`}>
                                        {selectedBacktest.total_return > 0 ? '+' : ''}{selectedBacktest.total_return.toFixed(2)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Başarı Oranı</div>
                                    <div className={`text-lg font-semibold ${getWinRateColor(selectedBacktest.win_rate)}`}>
                                        {selectedBacktest.win_rate.toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam İşlem</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedBacktest.total_trades}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Kazanan İşlem</div>
                                    <div className="text-lg font-semibold text-green-500">
                                        {selectedBacktest.winning_trades}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Kaybeden İşlem</div>
                                    <div className="text-lg font-semibold text-red-500">
                                        {selectedBacktest.losing_trades}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Komisyon</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        ${selectedBacktest.total_fees.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Parameters Section */}
                            <div className="mb-6">
                                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Kullanılan Parametreler</h4>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
                                        {JSON.stringify(selectedBacktest.parameters, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BacktestHistory;
