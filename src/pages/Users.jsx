import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, User, Shield, ShieldOff, CheckCircle2, AlertCircle, Trash2, Edit2, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

export default function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.email !== ADMIN_EMAIL && user.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        navigate(createPageUrl('Dashboard'));
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccess('بەکارهێنەر بە سەرکەوتوویی نوێکرایەوە');
      setTimeout(() => setSuccess(''), 3000);
      setShowEditDialog(false);
      setEditingUser(null);
    },
    onError: () => {
      setError('هەڵە لە نوێکردنەوەی بەکارهێنەر');
      setTimeout(() => setError(''), 3000);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccess('بەکارهێنەر بە سەرکەوتوویی سڕایەوە');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => {
      setError('هەڵە لە سڕینەوەی بەکارهێنەر');
      setTimeout(() => setError(''), 3000);
    }
  });

  const toggleUserRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateUserMutation.mutate({
      id: user.id,
      data: { role: newRole }
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      password: ''
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = () => {
    const dataToUpdate = {
      full_name: editForm.full_name,
      email: editForm.email
    };

    // Only include password if it's not empty
    if (editForm.password && editForm.password.trim() !== '') {
      dataToUpdate.password = editForm.password;
    }

    updateUserMutation.mutate({
      id: editingUser.id,
      data: dataToUpdate
    });
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`دڵنیایت لە سڕینەوەی ${user.full_name}؟`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const getUserExpenseCount = (userEmail) => {
    return expenses.filter(exp => exp.created_by === userEmail).length;
  };

  const getUserTotalExpense = (userEmail) => {
    return expenses
      .filter(exp => exp.created_by === userEmail)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (!currentUser || (currentUser.email !== ADMIN_EMAIL && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">بەڕێوەبردنی بەکارهێنەران</h1>
            <p className="text-gray-600 mt-1">لیستی هەموو بەکارهێنەرانی سیستەمەکە</p>
          </div>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">چاوەڕوان بە...</p>
          </div>
        ) : users.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">هیچ بەکارهێنەرێک نییە</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const expenseCount = getUserExpenseCount(user.email);
              const totalExpense = getUserTotalExpense(user.email);
              const isAdmin = user.role === 'admin' || user.email === ADMIN_EMAIL;

              return (
                <Card key={user.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className={`border-b ${isAdmin ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-emerald-50 to-teal-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                          {isAdmin ? (
                            <Shield className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{user.full_name}</CardTitle>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      {isAdmin ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                          <Shield className="w-3 h-3 ml-1" />
                          بەڕێوەبەر
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          <User className="w-3 h-3 ml-1" />
                          بەکارهێنەر
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-700">ژمارەی خەرجی:</span>
                        <span className="font-bold text-blue-600">{expenseCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">کۆی خەرجی:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalExpense)} د</span>
                      </div>
                      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                        تۆمارکراوە: {formatDate(user.created_date)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {user.email !== ADMIN_EMAIL && (
                        <>
                          <Button
                            onClick={() => toggleUserRole(user)}
                            disabled={updateUserMutation.isPending}
                            className={`w-full ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                          >
                            {isAdmin ? (
                              <>
                                <ShieldOff className="w-4 h-4 ml-2" />
                                لابردنی ڕۆڵی بەڕێوەبەر
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 ml-2" />
                                کردن بە بەڕێوەبەر
                              </>
                            )}
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditUser(user)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Edit2 className="w-4 h-4 ml-2" />
                              دەستکاری
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(user)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              سڕینەوە
                            </Button>
                          </div>
                        </>
                      )}

                      {user.email === ADMIN_EMAIL && (
                        <div className="text-center text-xs text-gray-500 p-2 bg-amber-50 rounded">
                          بەڕێوەبەری سەرەکی
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">دەستکاریکردنی بەکارهێنەر</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">ناوی تەواو</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="ناوی تەواو"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ئیمەیڵ</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  وشەی نهێنی نوێ (بەتاڵی بهێڵەرەوە بۆ نەگۆڕین)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="وشەی نهێنی نوێ"
                />
                <p className="text-xs text-gray-500">
                  ئەگەر وشەی نهێنی نەتگۆڕی، ئەم خانەیە بەتاڵ بهێڵەرەوە
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  {updateUserMutation.isPending ? 'نوێکردنەوە...' : 'نوێکردنەوە'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}