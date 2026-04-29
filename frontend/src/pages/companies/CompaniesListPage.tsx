import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CheckCircle2 } from "lucide-react";
import Container from "../../components/layout/Container";
import { Button, Input, Skeleton, EmptyState, Badge } from "../../components/ui";
import companyService from "../../services/company.service";
import { TourCompany } from "../../types/tour.types";
import { getLocalizedText } from "../../utils/localization";

const CompaniesListPage = () => {
  const [companies, setCompanies] = useState<TourCompany[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await companyService.list({
          city: cityFilter || undefined,
          limit: 50,
          offset: 0,
        });
        setCompanies(res.companies);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cityFilter]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="xl">
        <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Tour companies
            </h1>
            <p className="text-gray-600">
              Find trusted operators offering tours across Kazakhstan.
            </p>
          </div>
          <div className="w-full md:w-72">
            <Input
              label="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
              placeholder="Almaty, Astana..."
            />
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={180} />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies found"
            description="Try clearing filters or searching in another city."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {companies.map((c) => {
              const name = getLocalizedText(c.name);
              const city = getLocalizedText(c.city);
              const address = getLocalizedText(c.address);
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => navigate(`/companies/${c.id}`)}
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {c.logo ? (
                      <img
                        src={c.logo}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-semibold text-primary-600">
                        {name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {name}
                      </h2>
                      {c.is_verified && (
                        <Badge
                          variant="primary"
                          size="sm"
                          className="inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      {city}
                      {address && ` · ${address}`}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {c.total_tours} tours · Rating {c.rating.toFixed(1)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/companies/${c.id}`);
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default CompaniesListPage;

