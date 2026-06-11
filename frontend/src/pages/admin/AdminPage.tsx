import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Container from "../../components/layout/Container";
import { useAuth } from "../../contexts/AuthContext";
import attractionService from "../../services/attraction.service";
import categoryService from "../../services/category.service";
import adminService from "../../services/admin.service";
import { Attraction, Category } from "../../types/attraction.types";
import { User } from "../../types/auth";
import { Button, Input, Skeleton } from "../../components/ui";
import { getCurrentLocale, getLocalizedText } from "../../utils/localization";
import CreateAttractionModal from "./components/CreateAttractionModal";
import CategoryModal from "./components/CategoryModal";
import AdminPagination from "./components/AdminPagination";
import { useLocale } from "../../contexts/LocaleContext";
import * as m from "../../paraglide/messages.js";

const AdminPage = () => {
  useLocale();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canManageContent = user?.role === "admin" || user?.role === "manager";

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [attractionsTotal, setAttractionsTotal] = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);

  const [createAttractionOpen, setCreateAttractionOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [attractionPage, setAttractionPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadAttractionsPage = async (page: number) => {
    const offset = (page - 1) * PAGE_SIZE;
    const attractionResp = await attractionService.getAll({
      search: search || undefined,
      limit: PAGE_SIZE,
      offset,
    });
    setAttractions(attractionResp.attractions);
    setAttractionsTotal(attractionResp.total);
  };

  const loadCategoriesPage = async (page: number) => {
    const offset = (page - 1) * PAGE_SIZE;
    const categoryResp = await categoryService.getPage(PAGE_SIZE, offset);
    setCategories(categoryResp.categories);
    setCategoriesTotal(categoryResp.total);
  };

  const loadUsersPage = async (page: number) => {
    if (!isAdmin) {
      setUsers([]);
      setUsersTotal(0);
      return;
    }
    const offset = (page - 1) * PAGE_SIZE;
    const usersResp = await adminService.getUsers(PAGE_SIZE, offset);
    setUsers(usersResp.users);
    setUsersTotal(usersResp.total);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAttractionsPage(attractionPage),
        loadCategoriesPage(categoryPage),
        loadUsersPage(userPage),
      ]);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast.error(m.toast_admin_load_failed());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, attractionPage, categoryPage, userPage, search]);

  const attractionTotalPages = Math.max(1, Math.ceil(attractionsTotal / PAGE_SIZE));
  const categoryTotalPages = Math.max(1, Math.ceil(categoriesTotal / PAGE_SIZE));
  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / PAGE_SIZE));

  useEffect(() => {
    if (attractionPage > attractionTotalPages) {
      setAttractionPage(attractionTotalPages);
    }
  }, [attractionPage, attractionTotalPages]);

  useEffect(() => {
    if (categoryPage > categoryTotalPages) {
      setCategoryPage(categoryTotalPages);
    }
  }, [categoryPage, categoryTotalPages]);

  useEffect(() => {
    if (userPage > usersTotalPages) {
      setUserPage(usersTotalPages);
    }
  }, [userPage, usersTotalPages]);

  useEffect(() => {
    setAttractionPage(1);
  }, [search]);

  const handleCreateAttraction = async (data: {
    name: string;
    city: string;
    description: string;
    categoryIds: number[];
  }) => {
    if (!data.name.trim() || !data.city.trim()) {
      toast.error(m.toast_name_city_required());
      return;
    }

    const locale = getCurrentLocale();
    const payload = {
      name: { [locale]: data.name.trim() },
      city: { [locale]: data.city.trim() },
      description: data.description.trim()
        ? { [locale]: data.description.trim() }
        : undefined,
      category_ids: data.categoryIds,
    };

    try {
      setSaving(true);
      await attractionService.createAttraction(payload);
      toast.success(m.toast_attraction_created());
      setCreateAttractionOpen(false);
      setAttractionPage(1);
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || m.toast_create_attraction_failed());
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttraction = async (id: number) => {
    if (!confirm(m.confirm_delete_attraction())) return;
    try {
      await attractionService.deleteAttraction(id);
      toast.success(m.toast_attraction_deleted());
      if (attractions.length === 1 && attractionPage > 1) {
        setAttractionPage(attractionPage - 1);
      }
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || m.toast_delete_attraction_failed());
    }
  };

  const handleCategorySubmit = async (data: {
    name_en: string;
    name_ru?: string;
    icon: string;
  }) => {
    if (!data.name_en.trim() || !data.icon.trim()) {
      toast.error(m.toast_category_name_icon_required());
      return;
    }
    try {
      setSaving(true);
      if (categoryModalMode === "create") {
        await categoryService.create({
          name_en: data.name_en.trim(),
          name_ru: data.name_ru?.trim() || undefined,
          icon: data.icon.trim(),
        });
        toast.success(m.toast_category_created());
      } else if (editingCategory) {
        await categoryService.update(editingCategory.id, {
          name_en: data.name_en.trim(),
          name_ru: data.name_ru?.trim() || undefined,
          icon: data.icon.trim(),
        });
        toast.success(m.toast_category_updated());
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryPage(1);
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || m.toast_save_category_failed());
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm(m.confirm_delete_category())) return;
    try {
      await categoryService.delete(id);
      toast.success(m.toast_category_deleted());
      if (categories.length === 1 && categoryPage > 1) {
        setCategoryPage(categoryPage - 1);
      }
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || m.toast_delete_category_failed());
    }
  };

  const handleRoleChange = async (
    userId: string,
    role: "user" | "manager" | "admin",
  ) => {
    try {
      await adminService.updateUserRole(userId, role);
      toast.success(m.toast_role_updated());
      await loadAll();
    } catch (error: any) {
      toast.error(error?.message || m.toast_update_role_failed());
    }
  };

  if (!canManageContent) {
    return (
      <Container size="lg" className="py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{m.admin_no_access_title()}</h1>
        <p className="text-gray-600">{m.admin_no_access_desc()}</p>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{m.admin_title()}</h1>
            <p className="text-gray-600">
              {m.admin_subtitle()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCategoryModalMode("create");
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
            >
              {m.admin_new_category()}
            </Button>
            <Button variant="primary" onClick={() => setCreateAttractionOpen(true)}>
              {m.admin_new_attraction()}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{m.admin_attractions()}</h2>
              <div className="w-72">
                <Input
                  placeholder={m.admin_search_placeholder()}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={64} />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-2">{m.table_id()}</th>
                        <th className="py-2 pr-2">{m.table_name()}</th>
                        <th className="py-2 pr-2">{m.table_city()}</th>
                        <th className="py-2">{m.table_actions()}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attractions.map((a) => (
                        <tr key={a.id} className="border-b last:border-0">
                          <td className="py-2 pr-2">#{a.id}</td>
                          <td className="py-2 pr-2">{getLocalizedText(a.name)}</td>
                          <td className="py-2 pr-2">{getLocalizedText(a.city)}</td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.location.href = `/attractions/${a.id}?edit=1`;
                                }}
                              >
                                {m.edit()}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteAttraction(a.id)}
                              >
                                {m.delete()}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {attractions.length === 0 && (
                  <p className="text-sm text-gray-500">{m.admin_no_attractions()}</p>
                )}
                <AdminPagination
                  page={attractionPage}
                  totalPages={attractionTotalPages}
                  onPageChange={setAttractionPage}
                />
              </>
            )}
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{m.admin_categories()}</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={56} />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-2">{m.table_id()}</th>
                        <th className="py-2 pr-2">{m.table_name()}</th>
                        <th className="py-2 pr-2">{m.table_icon()}</th>
                        <th className="py-2">{m.table_actions()}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 pr-2">{c.id}</td>
                          <td className="py-2 pr-2">{c.name_en}</td>
                          <td className="py-2 pr-2">{c.icon}</td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCategoryModalMode("edit");
                                  setEditingCategory(c);
                                  setCategoryModalOpen(true);
                                }}
                              >
                                {m.edit()}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteCategory(c.id)}
                              >
                                {m.delete()}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AdminPagination
                  page={categoryPage}
                  totalPages={categoryTotalPages}
                  onPageChange={setCategoryPage}
                />
              </>
            )}
          </section>
        </div>

        {isAdmin && (
          <section className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{m.admin_user_roles()}</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={56} />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-2">Name</th>
                        <th className="py-2 pr-2">Email</th>
                        <th className="py-2">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="py-2 pr-2">{u.name}</td>
                          <td className="py-2 pr-2">{u.email}</td>
                          <td className="py-2">
                            <select
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                              value={u.role || "user"}
                              onChange={(e) =>
                                handleRoleChange(
                                  u.id,
                                  e.target.value as "user" | "manager" | "admin",
                                )
                              }
                            >
                              <option value="user">user</option>
                              <option value="manager">manager</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AdminPagination
                  page={userPage}
                  totalPages={usersTotalPages}
                  onPageChange={setUserPage}
                />
              </>
            )}
          </section>
        )}
      </Container>

      <CreateAttractionModal
        isOpen={createAttractionOpen}
        onClose={() => setCreateAttractionOpen(false)}
        categories={categories}
        saving={saving}
        onSubmit={handleCreateAttraction}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        saving={saving}
        mode={categoryModalMode}
        category={editingCategory}
        onSubmit={handleCategorySubmit}
      />
    </div>
  );
};

export default AdminPage;

