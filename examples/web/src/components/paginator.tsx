import {
	Pagination,
	PaginationGap,
	PaginationList,
	PaginationNext,
	PaginationPage,
	PaginationPrevious,
} from '@/components/catalyst/pagination';

type PaginatorProps = {
	currentPage: number;
	totalPages: number;
	pathname: string;
	searchParams?: Record<string, string | undefined>;
};

type PaginationItem = number | 'gap';

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}

	if (currentPage <= 4) {
		return [1, 2, 3, 4, 5, 'gap', totalPages];
	}

	if (currentPage >= totalPages - 3) {
		return [1, 'gap', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
	}

	return [1, 'gap', currentPage - 1, currentPage, currentPage + 1, 'gap', totalPages];
}

export function Paginator({ currentPage, totalPages, pathname, searchParams = {} }: PaginatorProps) {
	if (totalPages <= 1) {
		return null;
	}

	const createPageUrl = (page: number) => {
		const params = new URLSearchParams();

		for (const [key, value] of Object.entries(searchParams)) {
			if (value !== undefined && key !== 'page') {
				params.set(key, value);
			}
		}

		if (page > 1) {
			params.set('page', page.toString());
		}

		const queryString = params.toString();

		return queryString ? `${pathname}?${queryString}` : pathname;
	};

	const items = getPaginationItems(currentPage, totalPages);

	return (
		<Pagination>
			<PaginationPrevious href={currentPage > 1 ? createPageUrl(currentPage - 1) : undefined} />

			<PaginationList>
				{items.map((item, index) => {
					if (item === 'gap') {
						return <PaginationGap key={`gap-${index}`} />;
					}

					return (
						<PaginationPage key={item} href={createPageUrl(item)} current={item === currentPage}>
							{item}
						</PaginationPage>
					);
				})}
			</PaginationList>

			<PaginationNext href={currentPage < totalPages ? createPageUrl(currentPage + 1) : undefined} />
		</Pagination>
	);
}
