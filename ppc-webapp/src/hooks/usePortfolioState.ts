import { useReducer, useCallback, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  description: string;
  acv: string;
  target: string;
  integrations: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SeedKeyword {
  id: number;
  keyword: string;
  source: string;
  addedAt: Date;
  status: string;
}

interface SavedGroup {
  id: number | string;
  name: string;
  description?: string;
  createdAt: Date | string;
  color: string;
  keywords: any[];
}

interface ProductScopedData {
  keywords: any[];
  liveKeywords: Record<string, any[]>;
  campaigns: any[];
  channelConfigs: any[];
  icpProfiles: any[];
  buyerPersonas: any[];
  audienceSegments: any[];
  timeline: any;
  budgetMonthly: number;
  seedKeywords: SeedKeyword[];
  savedGroups: SavedGroup[];
  bingData: Record<string, any>;
  liveCompetitors: Record<string, any>;
  liveGaps: any[];
}

type PortfolioState = Record<string, ProductScopedData>;

// ---------------------------------------------------------------------------
// Hook params & return types
// ---------------------------------------------------------------------------

interface UsePortfolioStateParams {
  initialProducts: Product[];
  initialProductData: Record<string, ProductScopedData>;
}

interface UsePortfolioStateReturn {
  // Products
  products: Product[];
  activeProductId: string;
  activeProduct: Product | undefined;
  setActiveProductId: (id: string) => void;

  // Active product's scoped data
  activeData: ProductScopedData;
  updateActiveData: (partial: Partial<ProductScopedData>) => void;
  updateActiveDataFn: (fn: (current: ProductScopedData) => Partial<ProductScopedData>) => void;

  // Full portfolio (for dashboard)
  portfolioData: PortfolioState;

  // Product CRUD
  addProduct: (product: Product, initialData?: Partial<ProductScopedData>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Default data factory
// ---------------------------------------------------------------------------

export function createDefaultProductData(): ProductScopedData {
  return {
    keywords: [],
    liveKeywords: {},
    campaigns: [],
    channelConfigs: [
      {
        channel: "google-ads",
        label: "Google Ads",
        icon: "Search",
        color: "#0d9488",
        enabled: true,
        budgetPercent: 85,
        budgetAbsolute: 850,
        estimatedCtr: 3.5,
        estimatedConvRate: 3.2,
        estimatedCpc: 4.2,
        notes: "",
      },
      {
        channel: "bing-ads",
        label: "Bing Ads",
        icon: "Globe",
        color: "#8b5cf6",
        enabled: true,
        budgetPercent: 15,
        budgetAbsolute: 150,
        estimatedCtr: 4.1,
        estimatedConvRate: 3.8,
        estimatedCpc: 3.4,
        notes: "",
      },
    ],
    icpProfiles: [],
    buyerPersonas: [],
    audienceSegments: [],
    timeline: {
      id: crypto.randomUUID(),
      name: "New Timeline",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 270 * 86400000).toISOString().slice(0, 10),
      phases: [],
      totalBudget: 0,
    },
    budgetMonthly: 1000,
    seedKeywords: [],
    savedGroups: [],
    bingData: {},
    liveCompetitors: {},
    liveGaps: [],
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface ReducerState {
  products: Product[];
  activeProductId: string;
  productData: PortfolioState;
}

type PortfolioAction =
  | { type: "SET_ACTIVE_PRODUCT"; payload: string }
  | { type: "UPDATE_PRODUCT_DATA"; payload: Partial<ProductScopedData> }
  | { type: "UPDATE_PRODUCT_DATA_FN"; payload: (current: ProductScopedData) => Partial<ProductScopedData> }
  | { type: "ADD_PRODUCT"; payload: { product: Product; initialData?: Partial<ProductScopedData> } }
  | { type: "UPDATE_PRODUCT"; payload: { id: string; updates: Partial<Product> } }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "DUPLICATE_PRODUCT"; payload: string };

function portfolioReducer(state: ReducerState, action: PortfolioAction): ReducerState {
  switch (action.type) {
    // ------------------------------------------------------------------
    case "SET_ACTIVE_PRODUCT": {
      if (!state.productData[action.payload]) return state;
      return { ...state, activeProductId: action.payload };
    }

    // ------------------------------------------------------------------
    case "UPDATE_PRODUCT_DATA": {
      const { activeProductId, productData } = state;
      const current = productData[activeProductId];
      if (!current) return state;
      return {
        ...state,
        productData: {
          ...productData,
          [activeProductId]: { ...current, ...action.payload },
        },
      };
    }

    // ------------------------------------------------------------------
    case "UPDATE_PRODUCT_DATA_FN": {
      const { activeProductId: apId, productData: pd } = state;
      const cur = pd[apId];
      if (!cur) return state;
      const partial = action.payload(cur);
      return {
        ...state,
        productData: {
          ...pd,
          [apId]: { ...cur, ...partial },
        },
      };
    }

    // ------------------------------------------------------------------
    case "ADD_PRODUCT": {
      const { product, initialData } = action.payload;
      const defaults = createDefaultProductData();
      return {
        ...state,
        products: [...state.products, product],
        productData: {
          ...state.productData,
          [product.id]: { ...defaults, ...initialData },
        },
      };
    }

    // ------------------------------------------------------------------
    case "UPDATE_PRODUCT": {
      const { id, updates } = action.payload;
      const now = new Date().toISOString();
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: now } : p,
        ),
      };
    }

    // ------------------------------------------------------------------
    case "DELETE_PRODUCT": {
      const idToDelete = action.payload;
      // Prevent deleting the last product
      if (state.products.length <= 1) return state;

      const remaining = state.products.filter((p) => p.id !== idToDelete);
      const { [idToDelete]: _removed, ...restData } = state.productData;

      const nextActiveId =
        state.activeProductId === idToDelete ? remaining[0].id : state.activeProductId;

      return {
        products: remaining,
        activeProductId: nextActiveId,
        productData: restData,
      };
    }

    // ------------------------------------------------------------------
    case "DUPLICATE_PRODUCT": {
      const sourceId = action.payload;
      const sourceProduct = state.products.find((p) => p.id === sourceId);
      const sourceData = state.productData[sourceId];
      if (!sourceProduct || !sourceData) return state;

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();

      const clonedProduct: Product = {
        ...JSON.parse(JSON.stringify(sourceProduct)),
        id: newId,
        name: `${sourceProduct.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };

      const clonedData: ProductScopedData = JSON.parse(JSON.stringify(sourceData));

      return {
        ...state,
        products: [...state.products, clonedProduct],
        productData: {
          ...state.productData,
          [newId]: clonedData,
        },
      };
    }

    // ------------------------------------------------------------------
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function usePortfolioState({
  initialProducts,
  initialProductData,
}: UsePortfolioStateParams): UsePortfolioStateReturn {
  const [state, dispatch] = useReducer(portfolioReducer, undefined, () => {
    const productData: PortfolioState = {};
    for (const product of initialProducts) {
      productData[product.id] = initialProductData[product.id] ?? createDefaultProductData();
    }
    return {
      products: initialProducts,
      activeProductId: initialProducts[0]?.id ?? "",
      productData,
    };
  });

  // Stable action creators (dispatch itself is stable) -----------------------

  const setActiveProductId = useCallback(
    (id: string) => dispatch({ type: "SET_ACTIVE_PRODUCT", payload: id }),
    [],
  );

  const updateActiveData = useCallback(
    (partial: Partial<ProductScopedData>) =>
      dispatch({ type: "UPDATE_PRODUCT_DATA", payload: partial }),
    [],
  );

  const updateActiveDataFn = useCallback(
    (fn: (current: ProductScopedData) => Partial<ProductScopedData>) =>
      dispatch({ type: "UPDATE_PRODUCT_DATA_FN", payload: fn }),
    [],
  );

  const addProduct = useCallback(
    (product: Product, initialData?: Partial<ProductScopedData>) =>
      dispatch({ type: "ADD_PRODUCT", payload: { product, initialData } }),
    [],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) =>
      dispatch({ type: "UPDATE_PRODUCT", payload: { id, updates } }),
    [],
  );

  const deleteProduct = useCallback(
    (id: string) => dispatch({ type: "DELETE_PRODUCT", payload: id }),
    [],
  );

  const duplicateProduct = useCallback(
    (id: string) => dispatch({ type: "DUPLICATE_PRODUCT", payload: id }),
    [],
  );

  // Derived values -----------------------------------------------------------

  const activeProduct = useMemo(
    () => state.products.find((p) => p.id === state.activeProductId),
    [state.products, state.activeProductId],
  );

  const activeData: ProductScopedData =
    state.productData[state.activeProductId] ?? createDefaultProductData();

  return {
    products: state.products,
    activeProductId: state.activeProductId,
    activeProduct,
    setActiveProductId,

    activeData,
    updateActiveData,
    updateActiveDataFn,

    portfolioData: state.productData,

    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
  };
}

export default usePortfolioState;
