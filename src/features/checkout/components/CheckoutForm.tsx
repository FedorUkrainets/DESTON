"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, selectSubtotal } from "@/features/cart/store/cartStore";
import { formatPriceRub } from "@/lib/utils/format";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  CheckoutFormSchema,
  DELIVERY_OPTIONS,
  type CheckoutFormValues,
} from "@/features/checkout/schemas/checkout";
import { formatRuPhone } from "@/features/checkout/utils/formatPhone";
import styles from "./CheckoutForm.module.css";

const INITIAL_VALUES: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  pickupPointCode: "",
  deliveryProvider: "CDEK",
  comment: "",
};

type ErrorMap = Partial<Record<keyof CheckoutFormValues, string>>;

export function CheckoutForm(): React.ReactElement {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const clear = useCartStore((s) => s.clear);

  const [values, setValues] = useState<CheckoutFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K],
  ): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const parsed = CheckoutFormSchema.safeParse(values);
  const formIsValid = parsed.success && items.length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSubmitError(null);

    const result = CheckoutFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const next: ErrorMap = {};
      (Object.keys(fieldErrors) as Array<keyof CheckoutFormValues>).forEach((key) => {
        const list = fieldErrors[key];
        if (list && list.length > 0) next[key] = list[0];
      });
      setErrors(next);
      return;
    }
    if (items.length === 0) {
      setSubmitError("Корзина пуста.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...result.data,
            items: items.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              size: i.size,
              color: i.color,
            })),
          }),
        });

        const payload: unknown = await res.json();
        if (!res.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error: { message?: string } }).error?.message === "string"
              ? (payload as { error: { message: string } }).error.message
              : "Не удалось создать заказ.";
          setSubmitError(message);
          return;
        }

        const data = payload as { ok: true; data: { orderNumber: string; confirmationUrl: string | null } };
        clear();
        if (data.data.confirmationUrl) {
          window.location.href = data.data.confirmationUrl;
        } else {
          router.push(`/checkout/success?order=${encodeURIComponent(data.data.orderNumber)}`);
        }
      } catch {
        setSubmitError("Сетевая ошибка. Попробуйте ещё раз.");
      }
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.summary}>
        {items.length === 0 ? (
          <p className={styles.summaryEmpty}>Корзина пуста — вернитесь в каталог.</p>
        ) : (
          <ul className={styles.summaryList}>
            {items.map((it) => (
              <li key={it.variantId} className={styles.summaryItem}>
                <div className={styles.thumb} aria-hidden="true">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt="" className={styles.thumbImage} />
                  ) : null}
                </div>
                <div className={styles.summaryBody}>
                  <p className={styles.summaryName}>
                    {it.productName} ({it.color.toLowerCase()}) – {it.size}
                    {it.quantity > 1 ? ` × ${it.quantity}` : ""}
                  </p>
                  <p className={styles.summaryPrice}>
                    Цена: <strong>{formatPriceRub(it.unitPrice * it.quantity)}</strong>
                  </p>
                </div>
              </li>
            ))}
            <li className={styles.summaryTotalRow}>
              <span className={styles.summaryTotalLabel}>Итого:</span>
              <strong className={styles.summaryTotalValue}>{formatPriceRub(subtotal)}</strong>
            </li>
          </ul>
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.left}>
          <Input
            label="Ваше имя:"
            name="firstName"
            autoComplete="given-name"
            required
            value={values.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Ваша фамилия:"
            name="lastName"
            autoComplete="family-name"
            required
            value={values.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
          />
          <Input
            label="Ваш email:"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />
          <Input
            label="Ваш телефон:"
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder="8 XXX XXX XX XX"
            required
            value={values.phone}
            onChange={(e) => update("phone", formatRuPhone(e.target.value))}
            error={errors.phone}
          />
          <Input
            label="Комментарий:"
            name="comment"
            value={values.comment ?? ""}
            onChange={(e) => update("comment", e.target.value)}
            error={errors.comment}
          />
        </div>

        <div className={styles.right}>
          <h2 className={styles.rightTitle}>Доставка:</h2>

          <Input
            label="Город:"
            name="city"
            autoComplete="address-level2"
            required
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            error={errors.city}
          />
          <Input
            label="Адрес:"
            name="address"
            autoComplete="street-address"
            required
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            error={errors.address}
          />
          <Select
            label="ПВЗ:"
            name="deliveryProvider"
            options={DELIVERY_OPTIONS}
            value={values.deliveryProvider}
            onChange={(e) =>
              update("deliveryProvider", e.target.value as CheckoutFormValues["deliveryProvider"])
            }
            error={errors.deliveryProvider}
          />

          {submitError ? <p className={styles.submitError}>{submitError}</p> : null}

          <button
            type="submit"
            className={styles.submit}
            disabled={!formIsValid || pending}
            aria-busy={pending || undefined}
          >
            {pending ? "Обработка…" : "Оплатить"}
          </button>
        </div>
      </div>
    </form>
  );
}
